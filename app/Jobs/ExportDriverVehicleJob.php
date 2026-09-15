<?php

namespace App\Jobs;

use App\Http\Controllers\ExcelController;
use App\Models\ExcelDownload;
use App\Traits\DriverTrait;
use App\Traits\MerchantTrait;
use App\Exports\CustomExport;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Maatwebsite\Excel\Facades\Excel;
use DB;

class ExportDriverVehicleJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels, DriverTrait, MerchantTrait;
    protected $request;

    /**
     * Create a new job instance.
     *
     * @return void
     */
    public function __construct($request)
    {
        //
        $this->request = $request;
    }

    /**
     * Execute the job.
     *
     * @return void
     */
    // public function handle()
    // {
    //     $log = ExcelDownload::create([
    //         'merchant_id' => $this->request['merchant_id'],
    //         'filename' => '',
    //         'location' => '',
    //         'status' => 2,
    //     ]);

    //     try {
    //         $vehicles = $this->getAllVehicles(false, $this->request);

    //         $string_file = $this->getStringFile($this->request['merchant_id']);
    //         $export = [];
    //         foreach ($vehicles as $value) {
    
    //             foreach ($value->DriverVehicles as $vehicle) {
    //                 $status = 'Pending';
    //                 if ($vehicle->vehicle_verification_status == 2) {
    //                     $status = 'Verified';
    //                 } elseif ($vehicle->vehicle_verification_status == 3) {
    //                     $status = 'Rejected';
    //                 } elseif ($vehicle->vehicle_verification_status == 4) {
    //                     $status = 'Expired';
    //                 }
    
    //                 $export[] = [
    //                     $vehicle->shareCode,
    //                     $vehicle->vehicle_number,
    //                     $vehicle->VehicleType->VehicleTypeName,
    //                     $vehicle->VehicleMake->vehicleMakeName,
    //                     $vehicle->VehicleModel->VehicleModelName,
    //                     $value->fullName,
    //                     $value->phoneNumber,
    //                     $value->email,
    //                     //                \Carbon\Carbon::parse($value->created_at)->format('d-m-Y H:i:s'),
    //                     convertTimeToUSERzone($value->created_at, $vehicle->Driver->CountryArea->timezone, null, $vehicle->Merchant),
    //                     $status,
    //                     // get_image($vehicle->vehicle_image, 'user_vehicle_document', $this->request['merchant_id']),
    //                     // get_image($vehicle->vehicle_number_plate_image, 'user_vehicle_document', $this->request['merchant_id'])
    
    //                 ];
    //             }
    //         }
    
    //         // Define the headings
    //         $heading = [
    //             trans("$string_file.vehicle_id"),
    //             trans("$string_file.vehicle_number"),
    //             trans("$string_file.vehicle_type"),
    //             trans("$string_file.vehicle_make"),
    //             trans("$string_file.vehicle_model"),
    //             trans("$string_file.driver_name"),
    //             trans("$string_file.driver_phone_no"),
    //             trans("$string_file.driver_email"),
    //             trans("$string_file.created") . ' ' . trans("$string_file.at"),
    //             trans("$string_file.status"),
    //             // trans("$string_file.image"),
    //             // trans("$string_file.number") . trans("$string_file.plate") . trans("$string_file.image"),
    //         ];
    //         $file_name = 'vehicle-master-report-' . time() . '.csv';
    //         $filePath = 'excel-downloads/' . $file_name;
    //         Excel::store(new CustomExport($heading, $export), $filePath, 'local');


    //         $log->update([
    //             'filename' => $file_name,
    //             'location' => $filePath,
    //             'status' => 1,
    //         ]);
    //     } catch (\Exception $e) {
    //         $log->update([
    //             'status' => 0,
    //         ]);
    //         \Log::error('Excel export failed: ' . $e->getMessage());
    //     }

    // }
    
    public function handle()
    {
        try {
            
            $file_name = 'vehicle-master-report-' . time() . '.csv';
            $filePath = 'excel-downloads/' . $file_name;
        
            $log = \App\Models\ExcelDownload::create([
                'merchant_id' => $this->request['merchant_id'],
                'filename' => $file_name,
                'location' => $filePath,
                'status' => 2, // 2 = Processing
            ]);
        
            $merchantId = $this->request['merchant_id'];
            $string_file = $this->getStringFile($merchantId);
    
            $heading = [
                trans("$string_file.vehicle_id"),
                trans("$string_file.vehicle_number"),
                trans("$string_file.vehicle_type"),
                trans("$string_file.vehicle_make"),
                trans("$string_file.vehicle_model"),
                trans("$string_file.driver_name"),
                trans("$string_file.driver_phone_no"),
                trans("$string_file.driver_email"),
                trans("$string_file.created") . ' ' . trans("$string_file.at"),
                trans("$string_file.status"),
            ];
    
            
    
            $exportData = [];
    
            // Process drivers in chunks to prevent memory exhaustion
            \App\Models\Driver::with([
                'DriverVehicles',
                'DriverVehicles.VehicleType',
                'DriverVehicles.VehicleMake',
                'DriverVehicles.VehicleModel',
                'DriverVehicles.Driver.CountryArea',
                'DriverVehicles.Merchant'
            ])
            ->where('merchant_id', $merchantId)
            ->chunk(500, function ($drivers) use (&$exportData, $filePath, $string_file) {
                foreach ($drivers as $driver) {
                    foreach ($driver->DriverVehicles as $vehicle) {
    
                        // Determine verification status using if-elseif
                        $status = 'Pending';
                        if ($vehicle->vehicle_verification_status == 2) {
                            $status = 'Verified';
                        } elseif ($vehicle->vehicle_verification_status == 3) {
                            $status = 'Rejected';
                        } elseif ($vehicle->vehicle_verification_status == 4) {
                            $status = 'Expired';
                        }
    
                        // Safe property access
                        $vehicleType = optional($vehicle->VehicleType)->VehicleTypeName ?? 'N/A';
                        $vehicleMake = optional($vehicle->VehicleMake)->vehicleMakeName ?? 'N/A';
                        $vehicleModel = optional($vehicle->VehicleModel)->VehicleModelName ?? 'N/A';
                        $driverName = $driver->fullName ?? '';
                        $driverPhone = $driver->phoneNumber ?? '';
                        $driverEmail = $driver->email ?? '';
    
                        $createdAt = '';
                        if (!empty($driver->created_at) && !empty(optional($vehicle->Driver->CountryArea)->timezone)) {
                            $createdAt = convertTimeToUSERzone(
                                $driver->created_at,
                                $vehicle->Driver->CountryArea->timezone,
                                null,
                                $vehicle->Merchant
                            );
                        }
    
                        $exportData[] = [
                            $vehicle->shareCode ?? '',
                            $vehicle->vehicle_number ?? '',
                            $vehicleType,
                            $vehicleMake,
                            $vehicleModel,
                            $driverName,
                            $driverPhone,
                            $driverEmail,
                            $createdAt,
                            $status,
                        ];
                    }
                }
    
                // Write chunk to CSV file
                if (!empty($exportData)) {
                    $this->appendToCsv($filePath, $exportData, $string_file);
                    $exportData = []; // clear memory
                    gc_collect_cycles();
                }
            });
    
            $log->update([
                'status' => 1, // 1 = Completed
            ]);
    
        } catch (\Exception $e) {
            $log->update([
                'status' => 0, // 0 = Failed
            ]);
            \Log::channel('debugger_v1')->emergency(['error'=> $e->getMessage(), 'line'=> $e->getLine(), 'calling_from'=>'ExportDriverVehicleJob']);
        }
    }
    
    /**
     * Append data to CSV file (efficient low-memory writing)
     */
    protected function appendToCsv($filePath, $rows, $string_file)
    {
        $storagePath = storage_path('app/' . $filePath);
        $dir = dirname($storagePath);
    
        if (!file_exists($dir)) {
            mkdir($dir, 0777, true);
        }
    
        $isNewFile = !file_exists($storagePath);
        $handle = fopen($storagePath, 'a');
    
        // Write header if new file
        if ($isNewFile && !empty($rows)) {
            $headers = [
                trans("$string_file.vehicle_id"),
                trans("$string_file.vehicle_number"),
                trans("$string_file.vehicle_type"),
                trans("$string_file.vehicle_make"),
                trans("$string_file.vehicle_model"),
                trans("$string_file.driver_name"),
                trans("$string_file.driver_phone_no"),
                trans("$string_file.driver_email"),
                trans("$string_file.created") . ' ' . trans("$string_file.at"),
                trans("$string_file.status"),
            ];
            fputcsv($handle, $headers);
        }
    
        foreach ($rows as $row) {
            fputcsv($handle, $row);
        }
    
        fclose($handle);
    }

}
