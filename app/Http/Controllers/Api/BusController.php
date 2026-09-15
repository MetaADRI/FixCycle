<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Bus;
use App\Models\BusBooking;
use App\Models\BusBookingCheckout;
use App\Models\BusBookingMaster;
use App\Models\BusBookingDetail;
use App\Models\BusBookingRating;
use App\Models\BusRoute;
use App\Models\BusRouteMapping;
use App\Models\BusSeatDetail;
use App\Http\Resources\BusBookingResource;
use App\Http\Resources\BusBookingCheckoutResource;
use App\Services\BusServiceController;
use App\Traits\ApiResponseTrait;
use App\Traits\MerchantTrait;
use App\Traits\BusRouteTrait;
use App\Traits\BusStopTrait;
use App\Traits\BusBookingTrait;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BusController extends Controller
{
    use ApiResponseTrait, MerchantTrait, BusRouteTrait, BusStopTrait, BusBookingTrait;

    public function searchRoutes(Request $request)
    {
        try {
            $user = $request->user('api');
            $bus_route = new BusRoute();
            $routes = $bus_route->getNewNearestRoute($request, $user);
            return $this->successResponse('Success', ['routes' => $routes]);
        } catch (\Exception $e) {
            return $this->failedResponse($e->getMessage());
        }
    }

    public function routeStops(Request $request)
    {
        try {
            $validator = \Validator::make($request->all(), [
                'bus_route_id' => 'required|exists:bus_routes,id',
            ]);
            if ($validator->fails()) {
                return $this->failedResponse($validator->errors()->first());
            }
            $bus_route = BusRoute::with(['StartPoint', 'EndPoint', 'StopPoints' => function ($q) use ($request) {
                $q->where('bus_routes_bus_stops.bus_route_id', $request->bus_route_id);
                $q->orderBy('bus_routes_bus_stops.sequence');
            }])->find($request->bus_route_id);

            $stop_points = [];
            if ($bus_route->StartPoint) {
                $stop_points[] = [
                    'id' => $bus_route->StartPoint->id,
                    'name' => $bus_route->StartPoint->Name,
                    'latitude' => $bus_route->StartPoint->latitude,
                    'longitude' => $bus_route->StartPoint->longitude,
                    'address' => $bus_route->StartPoint->address ?? '',
                ];
            }
            foreach ($bus_route->StopPoints as $stop) {
                $stop_points[] = [
                    'id' => $stop->id,
                    'name' => $stop->Name,
                    'latitude' => $stop->latitude,
                    'longitude' => $stop->longitude,
                    'address' => $stop->address ?? '',
                ];
            }
            if ($bus_route->EndPoint) {
                $stop_points[] = [
                    'id' => $bus_route->EndPoint->id,
                    'name' => $bus_route->EndPoint->Name,
                    'latitude' => $bus_route->EndPoint->latitude,
                    'longitude' => $bus_route->EndPoint->longitude,
                    'address' => $bus_route->EndPoint->address ?? '',
                ];
            }

            return $this->successResponse('Success', [
                'route_id' => $bus_route->id,
                'route_name' => $bus_route->Name,
                'stop_points' => $stop_points,
            ]);
        } catch (\Exception $e) {
            return $this->failedResponse($e->getMessage());
        }
    }

    public function availableBuses(Request $request)
    {
        try {
            $validator = \Validator::make($request->all(), [
                'bus_route_id' => 'required|exists:bus_routes,id',
                'booking_date' => 'required|date|after_or_equal:today',
                'service_types_type' => 'nullable|in:1,2',
            ]);
            if ($validator->fails()) {
                return $this->failedResponse($validator->errors()->first());
            }
            $user = $request->user('api');
            $bus_route_mapping = new BusRouteMapping();
            $buses = $bus_route_mapping->routeBuses($request, $user);
            return $this->successResponse('Success', ['buses' => $buses]);
        } catch (\Exception $e) {
            return $this->failedResponse($e->getMessage());
        }
    }

    public function seatMap(Request $request)
    {
        try {
            $validator = \Validator::make($request->all(), [
                'bus_id' => 'required|exists:buses,id',
                'booking_date' => 'required|date|after_or_equal:today',
                'bus_route_id' => 'required|exists:bus_routes,id',
                'service_time_slot_detail_id' => 'required',
            ]);
            if ($validator->fails()) {
                return $this->failedResponse($validator->errors()->first());
            }
            $bus = Bus::with(['BusSeatDetail', 'BusRouteMapping' => function ($q) use ($request) {
                $q->where('bus_route_id', $request->bus_route_id);
                $q->where('service_time_slot_detail_id', $request->service_time_slot_detail_id);
            }])->find($request->bus_id);

            if (empty($bus)) {
                return $this->failedResponse('Bus not found');
            }

            $booked_seat_ids = BusBookingDetail::whereHas('BusBooking', function ($q) use ($request) {
                $q->where('bus_booking_master_id', function ($qq) use ($request) {
                    $qq->select('id')->from('bus_booking_masters')
                        ->where('bus_id', request('bus_id'))
                        ->where('bus_route_id', request('bus_route_id'))
                        ->where('service_time_slot_detail_id', request('service_time_slot_detail_id'))
                        ->where('booking_date', request('booking_date'))
                        ->where('status', '!=', 4);
                });
            })->pluck('bus_seat_detail_id')->toArray();

            $seat_details = $bus->BusSeatDetail->map(function ($seat) use ($booked_seat_ids) {
                return [
                    'id' => $seat->id,
                    'seat_no' => $seat->seat_no,
                    'type_slug' => $seat->type,
                    'is_booked' => in_array($seat->id, $booked_seat_ids),
                ];
            })->toArray();

            $seat_layout = $this->prepareBusSeatArray($bus->bus_design_type, $seat_details);

            return $this->successResponse('Success', [
                'bus_id' => $bus->id,
                'bus_name' => $bus->bus_name ?? '',
                'bus_design_type' => $bus->bus_design_type,
                'bus_type' => $bus->type,
                'seat_layout' => $seat_layout,
            ]);
        } catch (\Exception $e) {
            return $this->failedResponse($e->getMessage());
        }
    }

    public function checkout(Request $request)
    {
        try {
            $validator = \Validator::make($request->all(), [
                'bus_route_id' => 'required|exists:bus_routes,id',
                'bus_id' => 'required|exists:buses,id',
                'service_time_slot_detail_id' => 'required',
                'booking_date' => 'required|date|after_or_equal:today',
                'segment_id' => 'required',
                'service_type_id' => 'required',
                'pickup_point_id' => 'required',
                'drop_point_id' => 'required',
                'bus_stop_id' => 'required',
                'end_bus_stop_id' => 'required',
                'area' => 'required',
                'number_of_rider' => 'required|integer|min:1',
                'booking_for' => 'required|in:PASSENGER,PACKAGE',
                'email' => 'nullable|email',
                'phone_number' => 'nullable',
                'latitude' => 'required',
                'longitude' => 'required',
                'drop_latitude' => 'required',
                'drop_longitude' => 'required',
            ]);
            if ($validator->fails()) {
                return $this->failedResponse($validator->errors()->first());
            }

            $user = $request->user('api');
            $string_file = $this->getStringFile($request->merchant_id);

            if ($request->service_types_type == 1) {
                $checkout = BusServiceController::IntracityCheckout($request, $user, $string_file);
            } else {
                $checkout = BusServiceController::IntercityCheckout($request, $user, $string_file);
            }

            $checkout_resource = new BusBookingCheckoutResource($checkout);
            return $this->successResponse('Success', ['checkout' => $checkout_resource]);
        } catch (\Exception $e) {
            return $this->failedResponse($e->getMessage());
        }
    }

    public function confirm(Request $request)
    {
        try {
            $validator = \Validator::make($request->all(), [
                'bus_route_id' => 'required|exists:bus_routes,id',
                'bus_id' => 'required|exists:buses,id',
                'service_time_slot_detail_id' => 'required',
                'booking_date' => 'required|date|after_or_equal:today',
                'segment_id' => 'required',
                'service_type_id' => 'required',
                'pickup_point_id' => 'required',
                'drop_point_id' => 'required',
                'bus_stop_id' => 'required',
                'end_bus_stop_id' => 'required',
                'area' => 'required',
                'booking_for' => 'required|in:PASSENGER,PACKAGE',
                'payment_method_id' => 'required|exists:payment_methods,id',
            ]);
            if ($validator->fails()) {
                return $this->failedResponse($validator->errors()->first());
            }

            $user = $request->user('api');
            $string_file = $this->getStringFile($request->merchant_id);

            $booking_checkout = BusBookingCheckout::where([
                'merchant_id' => $request->merchant_id,
                'user_id' => $user->id,
                'bus_id' => $request->bus_id,
                'bus_route_id' => $request->bus_route_id,
                'booking_date' => $request->booking_date,
                'service_time_slot_detail_id' => $request->service_time_slot_detail_id,
                'segment_id' => $request->segment_id,
                'service_type_id' => $request->service_type_id,
            ])->first();

            if (empty($booking_checkout)) {
                return $this->failedResponse('Checkout not found');
            }

            $service = new BusServiceController();

            if ($request->service_types_type == 1) {
                $result = $service->IntracityConfirm($booking_checkout, $request, $user, $string_file);
            } else {
                $result = $service->IntercityConfirm($booking_checkout, $request, $user, $string_file);
            }

            $bus_booking = BusBooking::find($result['bus_booking_id']);
            $bus_booking_resource = new BusBookingResource($bus_booking);

            return $this->successResponse('Booking confirmed', ['bus_booking' => $bus_booking_resource]);
        } catch (\Exception $e) {
            return $this->failedResponse($e->getMessage());
        }
    }

    public function bookings(Request $request)
    {
        try {
            $user = $request->user('api');
            $bookings = BusBooking::with([
                'BusBookingMaster.Bus', 'BusBookingMaster.BusRoute',
                'BusBookingMaster.ServiceTimeSlotDetail', 'BusBookingMaster.Driver',
                'BusStop', 'EndBusStop',
            ])
                ->where('user_id', $user->id)
                ->where('merchant_id', $request->merchant_id)
                ->latest()
                ->paginate(20);

            return $this->successResponse('Success', ['bookings' => BusBookingResource::collection($bookings)]);
        } catch (\Exception $e) {
            return $this->failedResponse($e->getMessage());
        }
    }

    public function bookingDetail(Request $request)
    {
        try {
            $validator = \Validator::make($request->all(), [
                'bus_booking_id' => 'required',
            ]);
            if ($validator->fails()) {
                return $this->failedResponse($validator->errors()->first());
            }

            $user = $request->user('api');
            $bus_booking = BusBooking::with([
                'BusBookingMaster.Bus', 'BusBookingMaster.BusRoute',
                'BusBookingMaster.ServiceTimeSlotDetail', 'BusBookingMaster.Driver',
                'BusBookingMaster.Segment', 'BusBookingMaster.ServiceType',
                'BusBookingMaster.CountryArea', 'BusBookingMaster.CountryArea.Country',
                'BusStop', 'EndBusStop', 'PickupPoint', 'DropPoint',
                'BusBookingDetail.BusSeatDetail', 'BusBookingPackageDetail',
                'BusBookingRating', 'PaymentMethod', 'CountryArea', 'CountryArea.Country',
            ])
                ->where('user_id', $user->id)
                ->where('merchant_id', $request->merchant_id)
                ->find($request->bus_booking_id);

            if (empty($bus_booking)) {
                return $this->failedResponse('Booking not found');
            }

            $bus_booking_status = config('custom.bus_booking_status');
            $resource = new BusBookingResource($bus_booking);
            return $this->successResponse('Success', [
                'bus_booking' => $resource,
                'bus_booking_status' => $bus_booking_status,
            ]);
        } catch (\Exception $e) {
            return $this->failedResponse($e->getMessage());
        }
    }

    public function cancelBooking(Request $request)
    {
        try {
            $validator = \Validator::make($request->all(), [
                'bus_booking_id' => 'required',
            ]);
            if ($validator->fails()) {
                return $this->failedResponse($validator->errors()->first());
            }

            $user = $request->user('api');
            $bus_booking = BusBooking::where('user_id', $user->id)
                ->where('merchant_id', $request->merchant_id)
                ->find($request->bus_booking_id);

            if (empty($bus_booking)) {
                return $this->failedResponse('Booking not found');
            }

            $master = $bus_booking->BusBookingMaster;
            if (in_array($master->status, [3, 4, 5])) {
                return $this->failedResponse('Booking cannot be cancelled');
            }

            $master->status = 4;
            $master->save();

            $this->notifyBusBookingUser($bus_booking, 'BUS_BOOKING_MASTER_CANCEL');

            return $this->successResponse('Booking cancelled');
        } catch (\Exception $e) {
            return $this->failedResponse($e->getMessage());
        }
    }
}
