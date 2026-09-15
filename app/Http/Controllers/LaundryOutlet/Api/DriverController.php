<?php

namespace App\Http\Controllers\LaundryOutlet\Api;

use App\Http\Controllers\Controller;
use App\Models\LaundryOutlet\LaundryOutletOrder;
use App\Traits\LaundryServiceTrait;
use App\Traits\ApiResponseTrait;
use App\Traits\MerchantTrait;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DriverController extends Controller
{
    use LaundryServiceTrait, ApiResponseTrait, MerchantTrait;

    public function orderPickupVerify(Request $request)
    {
        try {
            $driver = $request->user('api-driver');
            $request->merge(['driver_id' => $driver->id]);
            $result = $this->LaundryOrderOTPVerification($request);
            return response()->json([
                'version' => '1.5',
                'result' => '1',
                'message' => $result['message'] ?? 'OTP verified',
                'data' => [],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'version' => '1.5',
                'result' => '0',
                'message' => $e->getMessage(),
            ]);
        }
    }

    public function deliverOrder(Request $request)
    {
        try {
            $driver = $request->user('api-driver');
            $laundry_outlet_order_id = $request->laundry_outlet_order_id;

            $order = LaundryOutletOrder::find($laundry_outlet_order_id);
            if (!$order || $order->driver_id != $driver->id) {
                return response()->json([
                    'version' => '1.5',
                    'result' => '0',
                    'message' => 'Order not found',
                ]);
            }

            DB::beginTransaction();

            if ($order->order_status == 16) {
                // Delivery driver picking up from outlet
                $request->merge(['laundry_outlet_order_id' => $order->id]);
                $this->LaundryOrderOTPVerification($request);
            }

            $order->order_status = 17;
            $this->saveLaundryOrderStatusHistory($request, $order);
            $order->save();

            DB::commit();

            $this->NotifyUser($order);

            return response()->json([
                'version' => '1.5',
                'result' => '1',
                'message' => 'Order delivered successfully',
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
}
