<?php

namespace App\Http\Controllers\LaundryOutlet\Api;

use App\Http\Controllers\Controller;
use App\Models\BookingRating;
use App\Models\CancelReason;
use App\Models\LaundryOutlet\LaundryOutlet;
use App\Models\LaundryOutlet\LaundryOutletOrder;
use App\Models\LaundryOutlet\LaundryOutletOrderDetail;
use App\Models\LaundryOutlet\LaundryService;
use App\Models\LaundryOutlet\LaundryServiceCart;
use App\Models\PromoCode;
use App\Models\ServiceTimeSlotDetail;
use App\Models\ServiceType;
use App\Traits\ApiResponseTrait;
use App\Traits\LaundryServiceTrait;
use App\Traits\MerchantTrait;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class UserController extends Controller
{
    use LaundryServiceTrait, ApiResponseTrait, MerchantTrait;

    public function getCategories(Request $request)
    {
        try {
            $merchant_id = $request->merchant_id;
            $segment_id = $request->segment_id ?? 5;
            $categories = $this->getCategory($merchant_id, $segment_id, 'parent', null, 'app');
            $categories = array_map(
                fn($category) => ['id' => $category['key'], 'name' => $category['value'], 'image' => ''],
                $categories
            );
            return response()->json([
                'version' => '1.5',
                'result' => '1',
                'message' => 'Success',
                'data' => ['arr_categories' => array_values($categories)],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'version' => '1.5',
                'result' => '0',
                'message' => $e->getMessage(),
            ]);
        }
    }

    public function getServices(Request $request)
    {
        try {
            $merchant_id = $request->merchant_id;
            $segment_id = $request->segment_id ?? 5;
            $request->merge(['return_type' => 'modified_array']);
            $services = $this->getLaundryServices($request);
            $categories = $this->getCategory($merchant_id, $segment_id, 'parent', null, 'app');
            $categories = array_map(
                fn($category) => ['id' => $category['key'], 'name' => $category['value'], 'image' => ''],
                $categories
            );
            $currency = $request->user('api')->Country->isoCode ?? '';
            return response()->json([
                'version' => '1.5',
                'result' => '1',
                'message' => 'Success',
                'data' => [
                    'services' => $services,
                    'categories' => $categories,
                    'currency' => $currency,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'version' => '1.5',
                'result' => '0',
                'message' => $e->getMessage(),
            ]);
        }
    }

    public function getOutlets(Request $request)
    {
        try {
            $merchant_id = $request->merchant_id;
            $segment_id = $request->segment_id ?? 5;
            $user_lat = $request->latitude ?? 0;
            $user_lng = $request->longitude ?? 0;
            $google_key = $request->merchant->Configuration->google_key ?? '';
            $unit = $request->merchant->Configuration->unit ?? 'km';

            $outlets = LaundryOutlet::where('merchant_id', $merchant_id)
                ->where('segment_id', $segment_id)
                ->where('status', 1)
                ->get();

            $formatted = $outlets->map(function ($outlet) use ($user_lat, $user_lng, $google_key, $unit, $merchant_id) {
                $distance = '';
                if (!empty($user_lat) && !empty($user_lng) && !empty($outlet->latitude) && !empty($outlet->longitude)) {
                    $dist = $this->calculateDistance($user_lat, $user_lng, $outlet->latitude, $outlet->longitude, $unit);
                    $distance = round($dist, 2) . ' ' . $unit;
                }

                $is_open = $this->isOutletOpen($outlet);
                $rating = $outlet->rating ?? '0';
                $image = !empty($outlet->business_logo) ? get_image($outlet->business_logo, 'laundry_outlet_logo', $merchant_id) : '';

                return [
                    'id' => $outlet->id,
                    'laundry_outlet_id' => $outlet->id,
                    'segment_id' => $outlet->segment_id,
                    'full_name' => $outlet->full_name,
                    'address' => $outlet->address ?? '',
                    'phone_number' => $outlet->phone_number ?? '',
                    'latitude' => $outlet->latitude,
                    'longitude' => $outlet->longitude,
                    'rating' => (string) $rating,
                    'rating_number' => (float) $rating,
                    'distance' => $distance,
                    'image' => $image,
                    'is_outlet_open' => $is_open,
                    'price_card_id' => $outlet->price_card_id ?? 0,
                    'currency' => $outlet->Country->isoCode ?? '',
                    'background_color' => $outlet->background_color ?? '',
                ];
            });

            return response()->json([
                'version' => '1.5',
                'result' => '1',
                'message' => 'Success',
                'data' => $formatted->toArray(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'version' => '1.5',
                'result' => '0',
                'message' => $e->getMessage(),
            ]);
        }
    }

    public function getOutlet(Request $request)
    {
        try {
            $outlet_id = $request->laundry_outlet_id;
            $outlet = LaundryOutlet::find($outlet_id);
            if (!$outlet) {
                return response()->json([
                    'version' => '1.5',
                    'result' => '0',
                    'message' => 'Outlet not found',
                ]);
            }
            $merchant_id = $request->merchant_id;
            $is_open = $this->isOutletOpen($outlet);
            $image = !empty($outlet->business_logo) ? get_image($outlet->business_logo, 'laundry_outlet_logo', $merchant_id) : '';
            return response()->json([
                'version' => '1.5',
                'result' => '1',
                'message' => 'Success',
                'data' => [
                    'id' => $outlet->id,
                    'laundry_outlet_id' => $outlet->id,
                    'segment_id' => $outlet->segment_id,
                    'full_name' => $outlet->full_name,
                    'address' => $outlet->address ?? '',
                    'phone_number' => $outlet->phone_number ?? '',
                    'latitude' => $outlet->latitude,
                    'longitude' => $outlet->longitude,
                    'rating' => (string) ($outlet->rating ?? '0'),
                    'rating_number' => (float) ($outlet->rating ?? 0),
                    'distance' => '',
                    'image' => $image,
                    'is_outlet_open' => $is_open,
                    'price_card_id' => $outlet->price_card_id ?? 0,
                    'currency' => $outlet->Country->isoCode ?? '',
                    'background_color' => $outlet->background_color ?? '',
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'version' => '1.5',
                'result' => '0',
                'message' => $e->getMessage(),
            ]);
        }
    }

    public function serviceSlots(Request $request)
    {
        try {
            $merchant_id = $request->merchant_id;
            $segment_id = $request->segment_id ?? 5;
            $time_format = $request->merchant->Configuration->time_format ?? 1;
            $timezone = $request->user('api')->CountryArea->timezone ?? 'UTC';

            $service_type = ServiceType::where('segment_id', $segment_id)->first();
            $service_type_id = $service_type ? $service_type->id : 1;

            $time_slots = ServiceTimeSlotDetail::where('merchant_id', $merchant_id)
                ->where('service_type_id', $service_type_id)
                ->where('status', 1)
                ->get();

            $slots = $time_slots->map(function ($slot) use ($time_format) {
                $from = strtotime($slot->from_time);
                $to = strtotime($slot->to_time);
                $start = $time_format == 2 ? date('H:i', $from) : date('h:i A', $from);
                $end = $time_format == 2 ? date('H:i', $to) : date('h:i A', $to);
                return [
                    'id' => $slot->id,
                    'service_time_slot_detail_id' => $slot->id,
                    'slot_time' => $start . ' - ' . $end,
                    'slot_text' => $start . ' - ' . $end,
                    'date' => '',
                    'is_selected' => 0,
                ];
            });

            return response()->json([
                'version' => '1.5',
                'result' => '1',
                'message' => 'Success',
                'data' => [
                    'time_slots' => $slots->values()->toArray(),
                    'instant_booking_time_slot_id' => null,
                    'instant_booking_after_text' => '',
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'version' => '1.5',
                'result' => '0',
                'message' => $e->getMessage(),
            ]);
        }
    }

    public function saveCart(Request $request)
    {
        try {
            $user = $request->user('api');
            $merchant_id = $request->merchant_id;
            $laundry_outlet_id = $request->laundry_outlet_id;
            $items = $request->items ?? [];
            $segment_id = $request->segment_id ?? 5;

            $service_type = ServiceType::where('segment_id', $segment_id)->first();
            $service_type_id = $request->service_type_id ?? ($service_type ? $service_type->id : 1);

            // Delete existing cart for this outlet
            LaundryServiceCart::where('user_id', $user->id)
                ->where('laundry_outlet_id', $laundry_outlet_id)
                ->where('merchant_id', $merchant_id)
                ->delete();

            $cart_amount = 0;
            $total_quantity = 0;
            $cart_items = [];

            foreach ($items as $item) {
                $service = LaundryService::find($item['laundry_service_id'] ?? $item['id'] ?? null);
                if (!$service) continue;

                $quantity = $item['quantity'] ?? 1;
                $price = $service->price;
                $total = $price * $quantity;
                $cart_amount += $total;
                $total_quantity += $quantity;

                LaundryServiceCart::create([
                    'user_id' => $user->id,
                    'merchant_id' => $merchant_id,
                    'laundry_outlet_id' => $laundry_outlet_id,
                    'laundry_service_id' => $service->id,
                    'segment_id' => $segment_id,
                    'service_type_id' => $service_type_id,
                    'quantity' => $quantity,
                    'price' => $price,
                    'total_amount' => $total,
                ]);

                $cart_items[] = [
                    'laundry_service_id' => $service->id,
                    'id' => $service->id,
                    'quantity' => $quantity,
                    'title' => $service->Name($merchant_id) ?? '',
                    'price' => $price,
                    'image' => !empty($service->service_cover_image) ? get_image($service->service_cover_image, 'laundry_service_cover_image', $merchant_id) : '',
                    'category_id' => $service->category_id,
                ];
            }

            $tax_rate = $request->merchant->Configuration->tax_rate ?? 0;
            $tax = ($cart_amount * $tax_rate) / 100;
            $delivery_amount = 0;
            $discount_amount = 0;
            $final_amount = $cart_amount + $delivery_amount + $tax - $discount_amount;

            return response()->json([
                'version' => '1.5',
                'result' => '1',
                'message' => 'Cart saved',
                'data' => [
                    'cart_id' => 0,
                    'laundry_outlet_id' => $laundry_outlet_id,
                    'segment_id' => $segment_id,
                    'service_type_id' => $service_type_id,
                    'service_time_slot_detail_id' => $request->service_time_slot_detail_id ?? 0,
                    'booking_date' => $request->booking_date ?? '',
                    'slot_time_text' => $request->slot_time_text ?? '',
                    'drop_location' => $request->drop_location ?? '',
                    'latitude' => $request->latitude ?? '',
                    'longitude' => $request->longitude ?? '',
                    'user_address_id' => $request->user_address_id ?? 0,
                    'payment_method_id' => $request->payment_method_id ?? 1,
                    'items' => $cart_items,
                    'total_quantity' => $total_quantity,
                    'cart_amount' => round($cart_amount, 2),
                    'delivery_amount' => round($delivery_amount, 2),
                    'tax' => round($tax, 2),
                    'discount_amount' => round($discount_amount, 2),
                    'final_amount' => round($final_amount, 2),
                    'applied_promo_code' => '',
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'version' => '1.5',
                'result' => '0',
                'message' => $e->getMessage(),
            ]);
        }
    }

    public function getCart(Request $request)
    {
        try {
            $user = $request->user('api');
            $merchant_id = $request->merchant_id;
            $laundry_outlet_id = $request->laundry_outlet_id;

            $carts = LaundryServiceCart::where('user_id', $user->id)
                ->where('laundry_outlet_id', $laundry_outlet_id)
                ->where('merchant_id', $merchant_id)
                ->with('LaundryService')
                ->get();

            $cart_amount = 0;
            $total_quantity = 0;
            $cart_items = [];

            foreach ($carts as $cart) {
                $service = $cart->LaundryService;
                if (!$service) continue;
                $cart_amount += $cart->total_amount;
                $total_quantity += $cart->quantity;
                $cart_items[] = [
                    'laundry_service_id' => $cart->laundry_service_id,
                    'id' => $cart->laundry_service_id,
                    'quantity' => $cart->quantity,
                    'title' => $service->Name($merchant_id) ?? '',
                    'price' => $cart->price,
                    'image' => !empty($service->service_cover_image) ? get_image($service->service_cover_image, 'laundry_service_cover_image', $merchant_id) : '',
                    'category_id' => $service->category_id,
                ];
            }

            $tax_rate = $request->merchant->Configuration->tax_rate ?? 0;
            $tax = ($cart_amount * $tax_rate) / 100;
            $final_amount = $cart_amount + $tax;

            return response()->json([
                'version' => '1.5',
                'result' => '1',
                'message' => 'Success',
                'data' => [
                    'cart_id' => $carts->first()->id ?? 0,
                    'laundry_outlet_id' => $laundry_outlet_id,
                    'segment_id' => $carts->first()->segment_id ?? 5,
                    'service_type_id' => $carts->first()->service_type_id ?? 1,
                    'service_time_slot_detail_id' => 0,
                    'booking_date' => '',
                    'slot_time_text' => '',
                    'drop_location' => '',
                    'latitude' => '',
                    'longitude' => '',
                    'user_address_id' => 0,
                    'payment_method_id' => 1,
                    'items' => $cart_items,
                    'total_quantity' => $total_quantity,
                    'cart_amount' => round($cart_amount, 2),
                    'delivery_amount' => 0,
                    'tax' => round($tax, 2),
                    'discount_amount' => 0,
                    'final_amount' => round($final_amount, 2),
                    'applied_promo_code' => '',
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'version' => '1.5',
                'result' => '0',
                'message' => $e->getMessage(),
            ]);
        }
    }

    public function deleteCart(Request $request)
    {
        try {
            $user = $request->user('api');
            $merchant_id = $request->merchant_id;
            $laundry_outlet_id = $request->laundry_outlet_id;

            $query = LaundryServiceCart::where('user_id', $user->id)
                ->where('laundry_outlet_id', $laundry_outlet_id)
                ->where('merchant_id', $merchant_id);

            if (!empty($request->laundry_service_id)) {
                $query->where('laundry_service_id', $request->laundry_service_id);
            }

            $query->delete();

            return $this->getCart($request);
        } catch (\Exception $e) {
            return response()->json([
                'version' => '1.5',
                'result' => '0',
                'message' => $e->getMessage(),
            ]);
        }
    }

    public function applyPromo(Request $request)
    {
        try {
            $user = $request->user('api');
            $merchant_id = $request->merchant_id;
            $laundry_outlet_id = $request->laundry_outlet_id;
            $promo_code = $request->promo_code;

            $cart_amount = 0;
            $carts = LaundryServiceCart::where('user_id', $user->id)
                ->where('laundry_outlet_id', $laundry_outlet_id)
                ->where('merchant_id', $merchant_id)
                ->get();

            foreach ($carts as $cart) {
                $cart_amount += $cart->total_amount;
            }

            $discount_amount = 0;
            if (!empty($promo_code)) {
                $promo = PromoCode::where('promo_code', $promo_code)
                    ->where('merchant_id', $merchant_id)
                    ->where('status', 1)
                    ->where('delete', null)
                    ->first();

                if ($promo && $cart_amount >= ($promo->minimum_booking_amount ?? 0)) {
                    if ($promo->discount_type == 1) {
                        $discount_amount = $promo->discount_amount;
                    } else {
                        $discount_amount = ($cart_amount * $promo->discount_amount) / 100;
                    }
                    $discount_amount = min($discount_amount, $promo->maximum_discount_amount ?? $discount_amount);
                }
            }

            $tax_rate = $request->merchant->Configuration->tax_rate ?? 0;
            $tax = ($cart_amount * $tax_rate) / 100;
            $final_amount = $cart_amount + $tax - $discount_amount;

            return $this->getCart($request);
        } catch (\Exception $e) {
            return response()->json([
                'version' => '1.5',
                'result' => '0',
                'message' => $e->getMessage(),
            ]);
        }
    }

    public function confirmOrder(Request $request)
    {
        try {
            $user = $request->user('api');
            $merchant_id = $request->merchant_id;
            $laundry_outlet_id = $request->laundry_outlet_id;
            $payment_method_id = $request->payment_method_id ?? 1;

            $validator = Validator::make($request->all(), [
                'laundry_outlet_id' => 'required|integer',
                'payment_method_id' => 'required|integer',
            ]);
            if ($validator->fails()) {
                return response()->json([
                    'version' => '1.5',
                    'result' => '0',
                    'message' => $validator->errors()->first(),
                ]);
            }

            $outlet = LaundryOutlet::find($laundry_outlet_id);
            if (!$outlet) {
                return response()->json([
                    'version' => '1.5',
                    'result' => '0',
                    'message' => 'Outlet not found',
                ]);
            }

            $carts = LaundryServiceCart::where('user_id', $user->id)
                ->where('laundry_outlet_id', $laundry_outlet_id)
                ->where('merchant_id', $merchant_id)
                ->get();

            if ($carts->isEmpty()) {
                return response()->json([
                    'version' => '1.5',
                    'result' => '0',
                    'message' => 'Cart is empty',
                ]);
            }

            $segment_id = $carts->first()->segment_id;
            $service_type_id = $carts->first()->service_type_id;

            $cart_amount = 0;
            $quantity = 0;
            foreach ($carts as $cart) {
                $cart_amount += $cart->total_amount;
                $quantity += $cart->quantity;
            }

            $tax_rate = $request->merchant->Configuration->tax_rate ?? 0;
            $tax = ($cart_amount * $tax_rate) / 100;
            $final_amount = $cart_amount + $tax;

            DB::beginTransaction();

            $order = new LaundryOutletOrder();
            $order->merchant_id = $merchant_id;
            $order->user_id = $user->id;
            $order->laundry_outlet_id = $laundry_outlet_id;
            $order->segment_id = $segment_id;
            $order->service_type_id = $service_type_id;
            $order->order_status = 1;
            $order->quantity = $quantity;
            $order->cart_amount = $cart_amount;
            $order->tax = $tax;
            $order->final_amount_paid = $final_amount;
            $order->payment_method_id = $payment_method_id;
            $order->payment_status = $payment_method_id == 2 ? 1 : 0;
            $order->drop_location = $request->drop_location ?? '';
            $order->drop_latitude = $request->latitude ?? $user->latitude ?? 0;
            $order->drop_longitude = $request->longitude ?? $user->longitude ?? 0;
            $order->additional_notes = $request->additional_notes ?? '';
            $order->order_status_history = json_encode([
                ['order_status' => 1, 'order_timestamp' => time()],
            ]);

            if (!empty($request->service_time_slot_detail_id)) {
                $order->service_time_slot_detail_id = $request->service_time_slot_detail_id;
                $slot = ServiceTimeSlotDetail::find($request->service_time_slot_detail_id);
                if ($slot) {
                    $order->order_date = Carbon::now()->format('Y-m-d');
                    $order->drop_date_time_slot = $slot->from_time . ' - ' . $slot->to_time;
                }
            } else {
                $order->order_date = Carbon::now()->format('Y-m-d');
            }

            $order->save();

            // Create order details
            foreach ($carts as $cart) {
                $service = LaundryService::find($cart->laundry_service_id);
                LaundryOutletOrderDetail::create([
                    'laundry_outlet_order_id' => $order->id,
                    'laundry_service_id' => $cart->laundry_service_id,
                    'quantity' => $cart->quantity,
                    'price' => $cart->price,
                    'total_amount' => $cart->total_amount,
                ]);
            }

            // Clear cart
            $carts->each->delete();

            // Assign driver
            try {
                $this->LaundryOrderPickupNotification($request, $order);
            } catch (\Exception $e) {
                // Driver assignment failure is not fatal
            }

            DB::commit();

            $this->NotifyUser($order);

            return response()->json([
                'version' => '1.5',
                'result' => '1',
                'message' => 'Order placed successfully',
                'data' => [
                    'order_id' => $order->id,
                    'order_status' => $order->order_status,
                    'message' => 'Order placed successfully',
                ],
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'version' => '1.5',
                'result' => '0',
                'message' => $e->getMessage(),
            ]);
        }
    }

    public function getOrders(Request $request)
    {
        try {
            $user = $request->user('api');
            $merchant_id = $request->merchant_id;
            $type = $request->type ?? 'ONGOING';

            $query = LaundryOutletOrder::where('user_id', $user->id)
                ->where('merchant_id', $merchant_id)
                ->with(['LaundryOutlet' => function ($q) {
                    $q->addSelect('id', 'full_name', 'business_logo', 'address');
                }])
                ->with(['LaundryOutletOrderDetail' => function ($q) {
                    $q->addSelect('id', 'laundry_outlet_order_id', 'laundry_service_id', 'quantity', 'price', 'total_amount');
                }])
                ->with(['Segment' => function ($q) use ($merchant_id) {
                    $q->addSelect('id', 'name');
                    $q->with(['Merchant' => function ($q2) {
                    }]);
                }])
                ->orderBy('created_at', 'DESC');

            if ($type == 'ONGOING') {
                $query->whereIn('order_status', [1, 6, 7, 9, 10, 13, 15, 16]);
            } else {
                $query->whereIn('order_status', [2, 3, 5, 8, 11, 12, 14, 17, 20]);
            }

            $orders = $query->get();
            $string_file = $this->getStringFile($merchant_id);
            $order_status_map = $this->getLaundryOrderStatus(['merchant_id' => $merchant_id]);

            $formatted = $orders->map(function ($order) use ($order_status_map, $merchant_id) {
                $outlet = $order->LaundryOutlet;
                $segment = $order->Segment;
                $details = $order->LaundryOutletOrderDetail;
                $currency = $order->CountryArea->Country->isoCode ?? '';
                $timezone = $order->CountryArea->timezone ?? 'UTC';

                $created_at = $order->created_at;
                try {
                    $date_obj = new Carbon($order->created_at);
                    $date_obj->setTimezone($timezone);
                    $created_at = $date_obj->format('Y-m-d H:i:s');
                } catch (\Exception $e) {}

                return [
                    'order_id' => $order->id,
                    'merchant_order_id' => (string) $order->merchant_order_id,
                    'laundry_outlet_id' => $order->laundry_outlet_id,
                    'outlet_name' => $outlet->full_name ?? '',
                    'outlet_image' => !empty($outlet->business_logo) ? get_image($outlet->business_logo, 'laundry_outlet_logo', $merchant_id) : '',
                    'outlet_address' => $outlet->address ?? '',
                    'segment_id' => $order->segment_id,
                    'segment_name' => $segment->Name($merchant_id) ?? $segment->slag ?? '',
                    'service_type_id' => $order->service_type_id,
                    'order_status_text' => $order_status_map[$order->order_status] ?? '',
                    'order_status' => $order->order_status,
                    'total_quantity' => $order->quantity,
                    'items_count' => $details->sum('quantity'),
                    'final_amount_paid' => (string) $order->final_amount_paid,
                    'currency' => $currency,
                    'booking_date' => $order->order_date ?? '',
                    'slot_time_text' => $order->drop_date_time_slot ?? '',
                    'is_rated' => !empty($order->BookingRating),
                ];
            });

            return response()->json([
                'version' => '1.5',
                'result' => '1',
                'message' => 'Success',
                'data' => $formatted->toArray(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'version' => '1.5',
                'result' => '0',
                'message' => $e->getMessage(),
            ]);
        }
    }

    public function getOrderDetail(Request $request)
    {
        try {
            $user = $request->user('api');
            $order_id = $request->order_id;
            $merchant_id = $request->merchant_id;

            $order = LaundryOutletOrder::with([
                'LaundryOutlet',
                'LaundryOutletOrderDetail',
                'Segment',
                'ServiceType',
                'PaymentMethod',
                'CountryArea.Country',
                'ServiceTimeSlotDetail',
                'BookingRating',
            ])
                ->where('user_id', $user->id)
                ->find($order_id);

            if (!$order) {
                return response()->json([
                    'version' => '1.5',
                    'result' => '0',
                    'message' => 'Order not found',
                ]);
            }

            return response()->json([
                'version' => '1.5',
                'result' => '1',
                'message' => 'Success',
                'data' => $this->buildOrderDetailData($request, $order),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'version' => '1.5',
                'result' => '0',
                'message' => $e->getMessage(),
            ]);
        }
    }

    private function buildOrderDetailData(Request $request, $order): array
    {
        $merchant_id = $order->merchant_id;
        $outlet = $order->LaundryOutlet;
        $string_file = $this->getStringFile($merchant_id);
        $order_status_map = $this->getLaundryOrderStatus(['merchant_id' => $merchant_id]);
        $status_progress = $this->LaundryServiceStatus($order);
        $cancel_reasons = CancelReason::where('merchant_id', $merchant_id)->get(['id', 'reason']);
        $timezone = $order->CountryArea->timezone ?? 'UTC';

        // Estimate delivery time
        $estimate_delivery = '';
        if (!empty($order->estimate_delivery_time)) {
            try {
                $est = new Carbon($order->estimate_delivery_time);
                $est->setTimezone($timezone);
                $estimate_delivery = $est->format('Y-m-d H:i');
            } catch (\Exception $e) {
                $estimate_delivery = $order->estimate_delivery_time;
            }
        }

        // Build items
        $items = $order->LaundryOutletOrderDetail->map(function ($detail) use ($merchant_id) {
            $service = LaundryService::find($detail->laundry_service_id);
            $image = '';
            if ($service && !empty($service->service_cover_image)) {
                $image = get_image($service->service_cover_image, 'laundry_service_cover_image', $merchant_id);
            }
            return [
                'id' => $detail->id,
                'laundry_service_id' => $detail->laundry_service_id,
                'title' => $service ? ($service->Name($merchant_id) ?? '') : '',
                'price' => (string) $detail->price,
                'quantity' => $detail->quantity,
                'total_amount' => (string) $detail->total_amount,
                'image' => $image,
            ];
        });

        // Payment detail
        $payment_detail = [
            'cart_amount' => (string) $order->cart_amount,
            'delivery_amount' => (string) ($order->delivery_amount ?? 0),
            'tax' => (string) $order->tax,
            'final_amount_paid' => (string) $order->final_amount_paid,
            'discount_amount' => (string) ($order->discount_amount ?? 0),
            'total_pending_amount' => '0',
            'pending_amount_status' => false,
            'pending_message' => '',
            'paid_status' => $order->payment_status == 1,
            'payment_method_id' => $order->payment_method_id,
            'payment_mode' => $order->PaymentMethod->MethodName($merchant_id) ?? ($order->PaymentMethod->payment_method ?? 'Cash'),
        ];

        // Actions
        $arr_action = [
            'cancel' => in_array($order->order_status, [1]),
            'pay' => $order->payment_status != 1,
            'otp_required' => $order->order_status == 9 && !empty($order->otp_for_pickup) && $order->user_confirmed_otp_for_pickup == 2,
        ];

        // Order status history
        $history = json_decode($order->order_status_history, true) ?? [];

        return [
            'order_id' => $order->id,
            'merchant_order_id' => (string) $order->merchant_order_id,
            'laundry_outlet_id' => $order->laundry_outlet_id,
            'outlet_name' => $outlet->full_name ?? '',
            'outlet_address' => $outlet->address ?? '',
            'outlet_image' => !empty($outlet->business_logo) ? get_image($outlet->business_logo, 'laundry_outlet_logo', $merchant_id) : '',
            'outlet_phone_number' => $outlet->phone_number ?? '',
            'outlet_latitude' => $outlet->latitude,
            'outlet_longitude' => $outlet->longitude,
            'segment_id' => $order->segment_id,
            'segment_name' => $order->Segment->Name($merchant_id) ?? $order->Segment->slag ?? '',
            'service_type_id' => $order->service_type_id,
            'order_status_text' => $order_status_map[$order->order_status] ?? '',
            'order_status' => $order->order_status,
            'order_otp' => (string) ($order->otp_for_pickup ?? ''),
            'otp_required' => $arr_action['otp_required'],
            'total_quantity' => $order->quantity,
            'items' => $items,
            'drop_location' => $order->drop_location ?? '',
            'drop_latitude' => (string) ($order->drop_latitude ?? ''),
            'drop_longitude' => (string) ($order->drop_longitude ?? ''),
            'booking_date' => $order->order_date ?? '',
            'slot_time_text' => $order->drop_date_time_slot ?? '',
            'estimate_delivery_time' => $estimate_delivery,
            'payment_detail' => $payment_detail,
            'cancel_reason' => $cancel_reasons->toArray(),
            'is_rated' => !empty($order->BookingRating),
            'arr_action' => $arr_action,
            'status_prgress' => $status_progress,
            'order_status_history' => $history,
        ];
    }

    public function verifyOtp(Request $request)
    {
        try {
            $user = $request->user('api');
            $order_id = $request->order_id;
            $otp = $request->otp;
            $merchant_id = $request->merchant_id;

            $order = LaundryOutletOrder::where('id', $order_id)
                ->where('user_id', $user->id)
                ->first();

            if (!$order) {
                return response()->json([
                    'version' => '1.5',
                    'result' => '0',
                    'message' => 'Order not found',
                ]);
            }

            if ($order->otp_for_pickup != $otp) {
                return response()->json([
                    'version' => '1.5',
                    'result' => '0',
                    'message' => 'Invalid OTP',
                ]);
            }

            $request->merge(['laundry_outlet_order_id' => $order->id]);
            $result = $this->LaundryOrderOTPVerification($request);

            $updated_order = $result['order'] ?? $order->fresh();
            return response()->json([
                'version' => '1.5',
                'result' => '1',
                'message' => $result['message'] ?? 'OTP verified',
                'data' => $this->buildOrderDetailData($request, $updated_order),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'version' => '1.5',
                'result' => '0',
                'message' => $e->getMessage(),
            ]);
        }
    }

    public function cancelOrder(Request $request)
    {
        try {
            $user = $request->user('api');
            $order_id = $request->order_id;
            $cancel_reason_id = $request->cancel_reason_id;
            $merchant_id = $request->merchant_id;

            $order = LaundryOutletOrder::where('id', $order_id)
                ->where('user_id', $user->id)
                ->first();

            if (!$order) {
                return response()->json([
                    'version' => '1.5',
                    'result' => '0',
                    'message' => 'Order not found',
                ]);
            }

            if (!in_array($order->order_status, [1])) {
                return response()->json([
                    'version' => '1.5',
                    'result' => '0',
                    'message' => 'Order cannot be cancelled at this stage',
                ]);
            }

            DB::beginTransaction();

            $order->order_status = 2;
            $order->cancel_reason_id = $cancel_reason_id;

            // Refund if paid online
            if ($order->payment_status == 1) {
                $order->refund = 1;
                $paramArray = [
                    'laundry_outlet_order_id' => $order->id,
                    'amount' => $order->final_amount_paid,
                    'user_id' => $order->user_id,
                    'narration' => 2,
                ];
                \App\Http\Controllers\Helper\WalletTransaction::UserWalletCredit($paramArray);
            }

            // Free driver if assigned
            if (!empty($order->driver_id)) {
                $driver = $order->Driver;
                if ($driver) {
                    $driver->free_busy = 2;
                    $driver->save();
                }
            }

            $this->saveLaundryOrderStatusHistory($request, $order);
            $order->save();

            DB::commit();

            $this->NotifyUser($order);

            return response()->json([
                'version' => '1.5',
                'result' => '1',
                'message' => 'Order cancelled successfully',
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'version' => '1.5',
                'result' => '0',
                'message' => $e->getMessage(),
            ]);
        }
    }

    public function rateOutlet(Request $request)
    {
        try {
            $user = $request->user('api');
            $order_id = $request->order_id;
            $rating = $request->rating;
            $comment = $request->comment ?? '';
            $merchant_id = $request->merchant_id;

            $order = LaundryOutletOrder::where('id', $order_id)
                ->where('user_id', $user->id)
                ->first();

            if (!$order) {
                return response()->json([
                    'version' => '1.5',
                    'result' => '0',
                    'message' => 'Order not found',
                ]);
            }

            if (!empty($order->BookingRating)) {
                return response()->json([
                    'version' => '1.5',
                    'result' => '0',
                    'message' => 'Already rated',
                ]);
            }

            BookingRating::create([
                'user_id' => $user->id,
                'driver_id' => $order->driver_id,
                'booking_id' => null,
                'order_id' => null,
                'laundry_outlet_order_id' => $order->id,
                'merchant_id' => $merchant_id,
                'user_rating_points' => $rating,
                'user_rating_comment' => $comment,
            ]);

            // Update outlet average rating
            $avg = BookingRating::where('laundry_outlet_order_id', '!=', null)
                ->whereHas('LaundryOutletOrder', function ($q) use ($order) {
                    $q->where('laundry_outlet_id', $order->laundry_outlet_id);
                })
                ->avg('user_rating_points');

            LaundryOutlet::where('id', $order->laundry_outlet_id)
                ->update(['rating' => round($avg, 2)]);

            return response()->json([
                'version' => '1.5',
                'result' => '1',
                'message' => 'Rating submitted',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'version' => '1.5',
                'result' => '0',
                'message' => $e->getMessage(),
            ]);
        }
    }

    private function calculateDistance($lat1, $lng1, $lat2, $lng2, $unit = 'km'): float
    {
        $earth_radius = $unit == 'miles' ? 3959 : 6371;
        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);
        $a = sin($dLat / 2) * sin($dLat / 2) + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLng / 2) * sin($dLng / 2);
        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));
        return $earth_radius * $c;
    }

    private function isOutletOpen($outlet): bool
    {
        if (empty($outlet->opening_time) || empty($outlet->closing_time)) {
            return true;
        }
        $now = Carbon::now()->format('H:i:s');
        return $now >= $outlet->opening_time && $now <= $outlet->closing_time;
    }
}
