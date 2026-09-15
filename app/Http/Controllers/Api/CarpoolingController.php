<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CarpoolingRide;
use App\Models\CarpoolingRideDetail;
use App\Models\CarpoolingRideUserDetail;
use App\Models\UserVehicle;
use App\Models\PriceCard;
use App\Models\PriceCardCommission;
use App\Models\CountryArea;
use App\Traits\ApiResponseTrait;
use App\Traits\MerchantTrait;
use App\Traits\CarpoolingTrait;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CarpoolingController extends Controller
{
    use ApiResponseTrait, MerchantTrait, CarpoolingTrait;

    public function searchRides(Request $request)
    {
        try {
            $validator = \Validator::make($request->all(), [
                'segment_id' => 'required',
                'pickup_latitude' => 'required|numeric',
                'pickup_longitude' => 'required|numeric',
                'drop_latitude' => 'required|numeric',
                'drop_longitude' => 'required|numeric',
                'pickup_location' => 'required|string',
                'drop_location' => 'required|string',
            ]);
            if ($validator->fails()) {
                return $this->failedResponse($validator->errors()->first());
            }

            $user = $request->user('api');
            $merchant_id = $request->merchant_id;
            $segment_id = $request->segment_id;

            $rides = CarpoolingRide::with(['User', 'UserVehicle', 'CarpoolingRideDetail'])
                ->where('merchant_id', $merchant_id)
                ->where('segment_id', $segment_id)
                ->whereIn('ride_status', [1, 2])
                ->where('available_seats', '>', 0)
                ->where('user_id', '!=', $user->id)
                ->get();

            $results = $rides->map(function ($ride) {
                return [
                    'id' => $ride->id,
                    'merchant_ride_id' => $ride->merchant_ride_id,
                    'ride_date' => $ride->ride_timestamp,
                    'start_location' => $ride->start_location,
                    'end_location' => $ride->end_location,
                    'available_seats' => $ride->available_seats,
                    'per_seat_price' => $ride->per_seat_price,
                    'ride_status' => $ride->ride_status,
                    'driver_name' => $ride->User->first_name . ' ' . $ride->User->last_name,
                    'vehicle' => !empty($ride->UserVehicle) ? [
                        'make' => $ride->UserVehicle->vehicle_make ?? '',
                        'model' => $ride->UserVehicle->vehicle_model ?? '',
                        'color' => $ride->UserVehicle->vehicle_color ?? '',
                        'number' => $ride->UserVehicle->vehicle_number ?? '',
                    ] : null,
                    'route_points' => $ride->CarpoolingRideDetail->map(function ($point) {
                        return [
                            'id' => $point->id,
                            'drop_no' => $point->drop_no,
                            'from_location' => $point->from_location,
                            'to_location' => $point->to_location,
                            'from_latitude' => $point->from_latitude,
                            'from_longitude' => $point->from_longitude,
                            'to_latitude' => $point->to_latitude,
                            'to_longitude' => $point->to_longitude,
                            'estimate_distance' => $point->estimate_distance,
                            'final_charges' => $point->final_charges,
                        ];
                    }),
                ];
            });

            return $this->successResponse('Success', ['rides' => $results]);
        } catch (\Exception $e) {
            return $this->failedResponse($e->getMessage());
        }
    }

    public function offerRide(Request $request)
    {
        try {
            $validator = \Validator::make($request->all(), [
                'segment_id' => 'required',
                'country_area_id' => 'required|exists:country_areas,id',
                'user_vehicle_id' => 'required|exists:user_vehicles,id',
                'available_seats' => 'required|integer|min:1',
                'ride_timestamp' => 'required|date|after:now',
                'start_location' => 'required|string',
                'end_location' => 'required|string',
                'route_points' => 'required|array|min:1',
                'route_points.*.drop_no' => 'required|integer',
                'route_points.*.from_location' => 'required|string',
                'route_points.*.to_location' => 'required|string',
                'route_points.*.from_latitude' => 'required|numeric',
                'route_points.*.from_longitude' => 'required|numeric',
                'route_points.*.to_latitude' => 'required|numeric',
                'route_points.*.to_longitude' => 'required|numeric',
                'route_points.*.estimate_distance' => 'required|numeric',
            ]);
            if ($validator->fails()) {
                return $this->failedResponse($validator->errors()->first());
            }

            $user = $request->user('api');
            $merchant_id = $request->merchant_id;
            $segment_id = $request->segment_id;
            $country_area_id = $request->country_area_id;

            $country_area = CountryArea::find($country_area_id);
            if (empty($country_area)) {
                return $this->failedResponse('Area not found');
            }
            $this->SetTimeZone($country_area_id);

            $first_point = $request->route_points[0];
            $last_point = end($request->route_points);

            $estimates = $this->estimateCalculate($merchant_id, $country_area_id, $segment_id, $first_point['estimate_distance']);

            $ride = new CarpoolingRide();
            $ride->merchant_id = $merchant_id;
            $ride->user_id = $user->id;
            $ride->segment_id = $segment_id;
            $ride->country_area_id = $country_area_id;
            $ride->user_vehicle_id = $request->user_vehicle_id;
            $ride->available_seats = $request->available_seats;
            $ride->booked_seats = 0;
            $ride->ride_timestamp = strtotime($request->ride_timestamp);
            $ride->return_ride = $request->return_ride ?? 0;
            $ride->return_ride_timestamp = isset($request->return_ride_timestamp) ? strtotime($request->return_ride_timestamp) : null;
            $ride->start_location = $request->start_location;
            $ride->end_location = $request->end_location;
            $ride->start_latitude = $first_point['from_latitude'];
            $ride->start_longitude = $first_point['from_longitude'];
            $ride->end_latitude = $last_point['to_latitude'];
            $ride->end_longitude = $last_point['to_longitude'];
            $ride->ride_status = 1;
            $ride->per_seat_price = $estimates['total_amount'];
            $ride->total_amount = 0;
            $ride->price_card_id = $estimates['price_card_id'];
            $ride->save();

            foreach ($request->route_points as $point) {
                $est = $this->estimateCalculate($merchant_id, $country_area_id, $segment_id, $point['estimate_distance']);
                $detail = new CarpoolingRideDetail();
                $detail->carpooling_ride_id = $ride->id;
                $detail->merchant_id = $merchant_id;
                $detail->user_id = $user->id;
                $detail->segment_id = $segment_id;
                $detail->drop_no = $point['drop_no'];
                $detail->from_location = $point['from_location'];
                $detail->to_location = $point['to_location'];
                $detail->from_latitude = $point['from_latitude'];
                $detail->from_longitude = $point['from_longitude'];
                $detail->to_latitude = $point['to_latitude'];
                $detail->to_longitude = $point['to_longitude'];
                $detail->estimate_distance = $point['estimate_distance'];
                $detail->ride_timestamp = $ride->ride_timestamp;
                $detail->final_charges = $est['total_amount'];
                $detail->price_card_id = $est['price_card_id'];
                $detail->save();
            }

            $this->carpoolingRideLog($ride, 'Ride offer created');

            $ride_data = [
                'id' => $ride->id,
                'merchant_ride_id' => $ride->merchant_ride_id,
                'ride_status' => $ride->ride_status,
                'start_location' => $ride->start_location,
                'end_location' => $ride->end_location,
                'available_seats' => $ride->available_seats,
                'per_seat_price' => $ride->per_seat_price,
            ];

            return $this->successResponse('Ride offered successfully', ['offer_ride' => $ride_data]);
        } catch (\Exception $e) {
            return $this->failedResponse($e->getMessage());
        }
    }

    public function bookRide(Request $request)
    {
        try {
            $validator = \Validator::make($request->all(), [
                'carpooling_ride_id' => 'required|exists:carpooling_rides,id',
                'carpooling_ride_detail_id' => 'required|exists:carpooling_ride_details,id',
                'booked_seats' => 'required|integer|min:1',
                'pickup_location' => 'required|string',
                'drop_location' => 'required|string',
                'pickup_latitude' => 'required|numeric',
                'pickup_longitude' => 'required|numeric',
                'drop_latitude' => 'required|numeric',
                'drop_longitude' => 'required|numeric',
                'payment_action' => 'required|in:1,2,3',
            ]);
            if ($validator->fails()) {
                return $this->failedResponse($validator->errors()->first());
            }

            $user = $request->user('api');
            $merchant_id = $request->merchant_id;

            $ride = CarpoolingRide::find($request->carpooling_ride_id);
            if (empty($ride)) {
                return $this->failedResponse('Ride not found');
            }
            if ($ride->ride_status != 1 && $ride->ride_status != 2) {
                return $this->failedResponse('Ride not available for booking');
            }
            if ($ride->user_id == $user->id) {
                return $this->failedResponse('Cannot book your own ride');
            }
            if ($ride->available_seats < $request->booked_seats) {
                return $this->failedResponse('Not enough seats available');
            }

            $ride_detail = CarpoolingRideDetail::find($request->carpooling_ride_detail_id);
            if (empty($ride_detail) || $ride_detail->carpooling_ride_id != $ride->id) {
                return $this->failedResponse('Invalid route point');
            }

            $this->SetTimeZone($ride->country_area_id);

            $total_amount = $this->calculateSeatAmount($ride_detail, $request->booked_seats);

            $user_detail = new CarpoolingRideUserDetail();
            $user_detail->carpooling_ride_id = $ride->id;
            $user_detail->carpooling_ride_detail_id = $request->carpooling_ride_detail_id;
            $user_detail->merchant_id = $merchant_id;
            $user_detail->user_id = $user->id;
            $user_detail->booked_seats = $request->booked_seats;
            $user_detail->pickup_location = $request->pickup_location;
            $user_detail->drop_location = $request->drop_location;
            $user_detail->pickup_latitude = $request->pickup_latitude;
            $user_detail->pickup_longitude = $request->pickup_longitude;
            $user_detail->drop_latitude = $request->drop_latitude;
            $user_detail->drop_longitude = $request->drop_longitude;
            $user_detail->ride_status = 2;
            $user_detail->payment_action = $request->payment_action;
            $user_detail->total_amount = $total_amount;
            $user_detail->ride_timestamp = $ride->ride_timestamp;
            $user_detail->end_timestamp = $ride_detail->end_timestamp ?? $ride->ride_timestamp;
            $user_detail->price_card_id = $ride_detail->price_card_id;
            $user_detail->promo_code_id = null;
            $user_detail->discount_amount = 0;
            $user_detail->save();

            $ride->booked_seats = $ride->booked_seats + $request->booked_seats;
            $ride->available_seats = $ride->available_seats - $request->booked_seats;
            if ($ride->available_seats <= 0) {
                $ride->ride_status = 2;
            }
            $ride->save();

            $this->carpoolingRideLog($ride, 'Ride booked', $user_detail);

            $currency = $ride->User->Country->isoCode;
            $response_data = [
                'carpooling_ride_user_detail_id' => $user_detail->id,
                'ride_status' => $user_detail->ride_status,
                'booked_seats' => $user_detail->booked_seats,
                'total_amount' => $currency . ' ' . $total_amount,
                'pickup_location' => $user_detail->pickup_location,
                'drop_location' => $user_detail->drop_location,
                'ride_date' => date('Y-m-d H:i', $ride->ride_timestamp),
            ];

            return $this->successResponse('Ride booked successfully', ['booking' => $response_data]);
        } catch (\Exception $e) {
            return $this->failedResponse($e->getMessage());
        }
    }

    public function offerRides(Request $request)
    {
        try {
            $user = $request->user('api');
            $merchant_id = $request->merchant_id;

            $rides = CarpoolingRide::with(['CountryArea', 'UserVehicle'])
                ->where('merchant_id', $merchant_id)
                ->where('user_id', $user->id)
                ->whereIn('ride_status', [1, 2, 3])
                ->latest()
                ->paginate(20);

            return $this->successResponse('Success', ['rides' => $rides]);
        } catch (\Exception $e) {
            return $this->failedResponse($e->getMessage());
        }
    }

    public function takenRides(Request $request)
    {
        try {
            $user = $request->user('api');
            $merchant_id = $request->merchant_id;

            $rides = CarpoolingRideUserDetail::with(['CarpoolingRide', 'CarpoolingRideDetail'])
                ->where('merchant_id', $merchant_id)
                ->where('user_id', $user->id)
                ->whereIn('ride_status', [1, 2, 3, 4])
                ->latest()
                ->paginate(20);

            return $this->successResponse('Success', ['rides' => $rides]);
        } catch (\Exception $e) {
            return $this->failedResponse($e->getMessage());
        }
    }

    public function rideDetail(Request $request)
    {
        try {
            $validator = \Validator::make($request->all(), [
                'carpooling_ride_user_detail_id' => 'required',
            ]);
            if ($validator->fails()) {
                return $this->failedResponse($validator->errors()->first());
            }

            $user = $request->user('api');
            $merchant_id = $request->merchant_id;

            $ride_detail = CarpoolingRideUserDetail::with([
                'CarpoolingRide', 'CarpoolingRideDetail',
                'CarpoolingRide.User', 'CarpoolingRide.UserVehicle',
                'CarpoolingRide.CarpoolingRideDetail',
                'User',
            ])
                ->where('merchant_id', $merchant_id)
                ->where('user_id', $user->id)
                ->find($request->carpooling_ride_user_detail_id);

            if (empty($ride_detail)) {
                return $this->failedResponse('Ride not found');
            }

            $ride_status = config('custom.carpooling_ride_status');

            $currency = $ride_detail->CarpoolingRide->User->Country->isoCode ?? '';
            $bill = $this->calculateBillAmount($ride_detail);

            $response = [
                'id' => $ride_detail->id,
                'ride_status' => $ride_detail->ride_status,
                'ride_status_text' => $ride_status[$ride_detail->ride_status] ?? '',
                'booked_seats' => $ride_detail->booked_seats,
                'total_amount' => $currency . ' ' . $ride_detail->total_amount,
                'pickup_location' => $ride_detail->pickup_location,
                'drop_location' => $ride_detail->drop_location,
                'pickup_latitude' => $ride_detail->pickup_latitude,
                'pickup_longitude' => $ride_detail->pickup_longitude,
                'drop_latitude' => $ride_detail->drop_latitude,
                'drop_longitude' => $ride_detail->drop_longitude,
                'ride_date' => date('Y-m-d H:i', $ride_detail->ride_timestamp),
                'driver_name' => $ride_detail->CarpoolingRide->User->first_name . ' ' . $ride_detail->CarpoolingRide->User->last_name,
                'vehicle' => !empty($ride_detail->CarpoolingRide->UserVehicle) ? [
                    'make' => $ride_detail->CarpoolingRide->UserVehicle->vehicle_make ?? '',
                    'model' => $ride_detail->CarpoolingRide->UserVehicle->vehicle_model ?? '',
                    'color' => $ride_detail->CarpoolingRide->UserVehicle->vehicle_color ?? '',
                    'number' => $ride_detail->CarpoolingRide->UserVehicle->vehicle_number ?? '',
                ] : null,
                'bill' => $bill,
            ];

            return $this->successResponse('Success', ['ride' => $response]);
        } catch (\Exception $e) {
            return $this->failedResponse($e->getMessage());
        }
    }

    public function cancelRide(Request $request)
    {
        try {
            $validator = \Validator::make($request->all(), [
                'carpooling_ride_user_detail_id' => 'required',
                'cancel_reason' => 'nullable|string',
            ]);
            if ($validator->fails()) {
                return $this->failedResponse($validator->errors()->first());
            }

            $user = $request->user('api');
            $merchant_id = $request->merchant_id;

            $ride_detail = CarpoolingRideUserDetail::where('merchant_id', $merchant_id)
                ->where('user_id', $user->id)
                ->find($request->carpooling_ride_user_detail_id);

            if (empty($ride_detail)) {
                return $this->failedResponse('Ride not found');
            }

            if (!in_array($ride_detail->ride_status, [1, 2])) {
                return $this->failedResponse('Ride cannot be cancelled');
            }

            $cancel_amount = $this->canceltakenCondition($ride_detail->id);

            $ride_detail->ride_status = 6;
            $ride_detail->cancel_amount = round($cancel_amount);
            $ride_detail->save();

            $ride = CarpoolingRide::find($ride_detail->carpooling_ride_id);
            $ride->available_seats = $ride->available_seats + $ride_detail->booked_seats;
            $ride->booked_seats = $ride->booked_seats - $ride_detail->booked_seats;
            $ride->save();

            $this->carpoolingRideLog($ride, 'Ride cancelled by passenger', $ride_detail);

            return $this->successResponse('Ride cancelled');
        } catch (\Exception $e) {
            return $this->failedResponse($e->getMessage());
        }
    }

    public function cancelOfferRide(Request $request)
    {
        try {
            $validator = \Validator::make($request->all(), [
                'carpooling_ride_id' => 'required|exists:carpooling_rides,id',
            ]);
            if ($validator->fails()) {
                return $this->failedResponse($validator->errors()->first());
            }

            $user = $request->user('api');
            $merchant_id = $request->merchant_id;

            $ride = CarpoolingRide::where('merchant_id', $merchant_id)
                ->where('user_id', $user->id)
                ->find($request->carpooling_ride_id);

            if (empty($ride)) {
                return $this->failedResponse('Ride not found');
            }

            if (!in_array($ride->ride_status, [1, 2])) {
                return $this->failedResponse('Ride cannot be cancelled');
            }

            $cancel_amount = $this->cancelOfferCondition($ride->id);

            $ride->ride_status = 5;
            $ride->cancel_amount = round($cancel_amount);
            $ride->save();

            $this->carpoolingRideLog($ride, 'Ride cancelled by driver');

            return $this->successResponse('Offer ride cancelled');
        } catch (\Exception $e) {
            return $this->failedResponse($e->getMessage());
        }
    }
}
