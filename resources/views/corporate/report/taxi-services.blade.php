@extends('corporate.layouts.main')
@section('content')
    <style>
        #ecommerceRecentride .table-row .card-block .table td {
            vertical-align: middle !important;
            height: 15px !important;
            font-size: 14px !important;
            padding: 8px 8px !important;
        }
        .dataTables_filter, .dataTables_info {
            display: none;
        }
    </style>
    <div class="page">
        <div class="page-content">
            @include("merchant.shared.errors-and-messages")
            <div class="panel panel-brideed">
                <header class="panel-heading">
                    <div class="panel-actions">
                        <!--@if(!empty($info_setting) && $info_setting->view_text != "")-->
                        <!--    <button class="btn btn-icon btn-primary float-right" style="margin:10px"-->
                        <!--            data-target="#examplePositionSidebar" data-toggle="modal" type="button">-->
                        <!--        <i class="wb-info ml-1 mr-1" title="Info" style=""></i>-->
                        <!--    </button>-->
                        <!--@endif-->
                        @if($export_permission)
                            <a href="{{route('corporate.taxi.earning.export',$arr_search)}}">
                                <button type="button" title="@lang("$string_file.export_rides")"
                                        class="btn btn-icon btn-success float-right" style="margin:10px"><i
                                            class="wb-download"></i>
                                </button>
                            </a>
                        @endif
                    </div>
                    <h3 class="panel-title">
                        <i class="icon wb-list" aria-hidden="true"></i>
                        @lang("$string_file.ride_statistics")
                        </span>
                    </h3>
                </header>
                <div class="panel-body container-fluid">

                    <hr>
                    <!-- First Row -->
                    <div class="row">
                        <div class="col-xl-3 col-md-6 info-panel">
                            <div class="card card-shadow">
                                <div class="card-block bg-grey-100 p-20">
                                    <button type="button" class="btn btn-floating btn-sm btn-warning">
                                        <i class="icon wb-shopping-cart"></i>
                                    </button>
                                    <span class="ml-15 font-weight-400">@lang("$string_file.rides")</span>
                                    <div class="content-text text-center mb-0">
                                        <span class="font-size-20 font-weight-100">{{$total_rides}}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-xl-3 col-md-3 info-panel">
                            <div class="card card-shadow">
                                <div class="card-block bg-grey-100 p-20">
                                    <button type="button" class="btn btn-floating btn-sm btn-danger">
                                        <i class="icon fa-dollar"></i>
                                    </button>
                                    <span class="ml-15 font-weight-400">@lang("$string_file.ride_amount")</span>
                                    <div class="content-text text-center mb-0">
                                        <span class="font-size-20 font-weight-100">{{isset($earning_summary['ride_amount']) ? $currency.$earning_summary['ride_amount'] : 0}}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        @php
                            $merchant_earning = isset($earning_summary['merchant_earning']) ? $earning_summary['merchant_earning'] : 0;
                            $booking_fee = isset($earning_summary['booking_fee']) ? $earning_summary['booking_fee'] : 0;
                            $total_earning = $currency.($merchant_earning+$booking_fee);
                        @endphp
{{--                        <div class="col-xl-3 col-md-3 info-panel">--}}
{{--                            <div class="card card-shadow">--}}
{{--                                <div class="card-block bg-grey-100 p-20">--}}
{{--                                    <button type="button" class="btn btn-floating btn-sm btn-danger">--}}
{{--                                        <i class="icon fa-percent"></i>--}}
{{--                                    </button>--}}
{{--                                    <span class="ml-15 font-weight-400">@lang("$string_file.total") @lang("$string_file.corporate") @lang("$string_file.expense")</span>--}}
{{--                                    <div class="content-text text-center mb-0">--}}
{{--                                        <span class="font-size-20 font-weight-100">{{isset($earning_summary['corporate_charges']) ? $currency.$earning_summary['corporate_charges'] : 0}}</span>--}}
{{--                                    </div>--}}
{{--                                </div>--}}
{{--                            </div>--}}
{{--                        </div>--}}

                    </div>
                    <hr>

                    <!-- Third Row -->
                    <!-- Third Left -->
                    <div class="row">
                        <div class="col-lg-12" id="ecommerceRecentride">
                            <div class="card card-shadow table-row">
                                <div class="card-block bg-white table-responsive">
                                    <form action="{{ route('corporate.taxi.services') }}" method="GET">
                                        @csrf
                                        <div class="table_search row">
{{--                                            <div class="col-md-2 col-xs-12 form-group active-margin-top">--}}
{{--                                                @lang("$string_file.search_by"):--}}
{{--                                            </div>--}}
                                            <div class="col-md-3 col-xs-12 form-group active-margin-top">
                                                <div class="input-group">
                                                    <select class="form-control select2" name="department_id" id="department_id" onchange="getDepartmentUsers(this.value)">
                                                        <option value="">select department</option>
                                                        @foreach($departments as $department)
                                                            <option @if(isset($arr_search['department_id']) && $arr_search['department_id'] == $department->id) Selected @endif  value="{{$department->id}}">{{$department->name}}</option>
                                                        @endforeach
                                                    </select>
                                                </div>
                                            </div>
                                            <div class="col-md-3 col-xs-12 form-group active-margin-top">
                                                <div class="input-group">
                                                    <select class="form-control select2" name="user_id" id="user_id">
                                                        <option value="">select user</option>
                                                        @foreach($corporate_users as $user)
                                                            <option @if(isset($arr_search['user_id']) && $arr_search['user_id'] == $user->id) Selected @endif value="{{$user->id}}">{{$user->first_name." ".$user->last_name." ( ".$user->UserPhone." ) "}}</option>
                                                        @endforeach
                                                    </select>
                                                </div>
                                            </div>

                                            <div class="col-md-2 col-xs-12 form-group active-margin-top">
                                                <div class="input-group">
                                                    <input type="text" id="start" name="start" @if(!empty($arr_search['start'])) value="{{$arr_search['start']}}" @endif
                                                           placeholder=" @lang("$string_file.date") @lang("$string_file.from") "
                                                           class="form-control col-md-12 col-xs-12 datepickersearch"
                                                           id="datepickersearch" autocomplete="off">
                                                </div>
                                            </div>


                                            <div class="col-md-2 col-xs-12 form-group active-margin-top">
                                                <div class="input-group">
                                                    <input type="text" id="end_date" name="end" @if(!empty($arr_search['end'])) value="{{$arr_search['end']}}" @endif
                                                           placeholder="  @lang("$string_file.date") @lang("$string_file.to")"
                                                           class="form-control col-md-12 col-xs-12 datepickersearch"
                                                           id="datepickersearch" autocomplete="off">
                                                </div>
                                            </div>

                                            <div class="col-sm-2 col-xs-12 form-group active-margin-top">
                                                <button class="btn btn-primary" type="submit"
                                                        name="seabt12"><i
                                                            class="fa fa-search" aria-hidden="true"></i>
                                                </button>
                                                <button class="btn btn-success" type="button"
                                                        name="seabt12"><a style="text-decoration: none; color: white" href="{{route('corporate.taxi.services')}}"><i class="fa fa-refresh" aria-hidden="true"></i></a>
                                                </button>
                                            </div>
                                        </div>
                                    </form>
                                    <table id="customDataTable" class="display nowrap table table-hover table-bordered report_table"
                                           style="width:100%">
                                        <thead>
                                        @php
                                            $col_span =  $arr_parameter->count();$extra_col_span = 0; $merchant_extra_col_span = 0;@endphp
                                        <tr class="text-center report_table_row_heading">
                                            <th rowspan="2">@lang("$string_file.sn")</th>
{{--                                            <th rowspan="2">@lang("$string_file.driver_id")</th>--}}
                                            <th rowspan="2">@lang("$string_file.ride_id")</th>
{{--                                            <th rowspan="2">@lang("$string_file.payment_method")</th>--}}
                                            <th rowspan="2">@lang("$string_file.user_details")</th>
                                            <th rowspan="2">@lang("$string_file.user") @lang("$string_file.phone")</th>
                                            <th rowspan="2">@lang("$string_file.driver_details")</th>
                                            <th rowspan="2">@lang("$string_file.vehicle_number")</th>
                                            <th rowspan="2">@lang("$string_file.pickup_location")</th>
                                            <th rowspan="2">@lang("$string_file.drop_location")</th>
                                            <th colspan={{($col_span + 8 + $extra_col_span)}}>@lang("$string_file.ride_amount")</th>
                                        </tr>
{{--                                        <tr class="report_table_row_heading">--}}
{{--                                            <th>@lang("$string_file.base_fare")</th>--}}

{{--                                            @foreach($arr_parameter as $param)--}}
{{--                                                @if($param['parameterType'] != 13)--}}
{{--                                                    <th>{{!empty($param['name']) ? $param['name'] : ""}}</th>--}}
{{--                                                @endif--}}
{{--                                            @endforeach--}}

{{--                                            <th>@lang("$string_file.extra_charges")</th>--}}
{{--                                            <th>@lang("$string_file.sub_total_before_discount")</th>--}}
{{--                                            <th>@lang("$string_file.discount")</th>--}}
{{--                                            <th>@lang("$string_file.sub_total")</th>--}}

{{--                                            @foreach($arr_parameter as $param)--}}
{{--                                                @if($param['parameterType'] == 13)--}}
{{--                                                    <th>{{!empty($param['name']) ? $param['name'] : ""}}</th>--}}
{{--                                                @endif--}}
{{--                                            @endforeach--}}

{{--                                            <th>@lang("$string_file.tip")</th>--}}
{{--                                            <th>@lang("$string_file.toll")</th>--}}
{{--                                            <th>@lang("$string_file.corporate") @lang("$string_file.expense")</th>--}}
                                            <th>@lang("$string_file.paid_amount")</th>
                                            <th>@lang("$string_file.created_at")</th>

                                        </tr>
                                        </thead>
                                        <tbody>

                                        @if(!empty($arr_rides_details))
                                            @php $sr = $arr_rides->firstItem(); $user_name = ''; $user_phone = ''; $user_email = '';
                                                        $driver_name = '';$driver_email = ''; $currency = "";
                                                        $tax_amount =    !empty($ride->tax) ? $ride->tax : 0;
                                            @endphp
                                            @foreach($arr_rides_details as $ride)
                                                @php
                                                    $helperMerchant = new \App\Http\Controllers\Helper\Merchant();
                                                   $arr_invoice = array_column($ride->invoice,NULL,'id');
                                                   $tip = isset($arr_invoice['Tip']) ? $arr_invoice['Tip']['value'] : 0;
                                                   $toll = isset($arr_invoice['TollCharges']) ? $arr_invoice['TollCharges']['value'] : 0;
                                                   $cancellation_amount = isset($arr_invoice['Cancellation fee']) ? $arr_invoice['Cancellation fee']['value'] : 0;
                                                   $additional_mover_amount = isset($arr_invoice['Additional Mover Charger']) ? $arr_invoice['Additional Mover Charger']['value'] : 0;
                                                   // peak time charges is storing in extra charges column
                                                   //$peak_time_charge = isset($arr_invoice['Peak Time Charges']) ? $arr_invoice['Peak Time Charges']['value'] : 0;
                                                   $discount = isset($arr_invoice['promo_code']) ? $arr_invoice['promo_code']['value'] : 0;
                                                   $corporate_charges = isset($arr_invoice['Corporate Charges']) ? $arr_invoice['Corporate Charges']['value'] : 0;
                                                   $ride_total = 0;
                                                         $currency = $ride->CountryArea->Country->isoCode;
                                                @endphp
                                                @if(!empty($ride->BookingTransaction))
                                                    @php $transaction = $ride->BookingTransaction;
                                                    $ride_total = $transaction->sub_total_before_discount;
                                                    @endphp
                                                @endif
                                                <tr>
                                                    <td>{{$sr}}</td>
{{--                                                    <td>--}}
{{--                                                        {{$ride->Driver->id}}--}}
{{--                                                    </td>--}}
                                                    <td>
                                                        <a href="{{route('corporate.booking.invoice',$ride->id)}}">{{ $ride->merchant_booking_id }}</a>
                                                    </td>

{{--                                                    <td>--}}
{{--                                                        @if(!empty($ride->PaymentMethod))--}}
{{--                                                            {{$ride->PaymentMethod->MethodName($ride->merchant_id) ? $ride->PaymentMethod->MethodName($ride->merchant_id) : $ride->PaymentMethod->payment_method}}--}}
{{--                                                        @else--}}
{{--                                                            ----}}
{{--                                                        @endif--}}
{{--                                                    </td>--}}

                                                    <td>{{is_demo_data($ride->User->first_name.' '.$ride->User->last_name,$ride->Merchant)}}</td>
                                                    <td>{{ $ride->User->UserPhone}}</td>
                                                    <td>{{is_demo_data($ride->Driver->first_name.' '.$ride->Driver->last_name,$ride->Merchant)}}</td>
                                                    <td>{{$ride->DriverVehicle->vehicle_number}}</td>
                                                    <td>{{$ride->pickup_location}}</td>
                                                    <td>{{$ride->drop_location}}</td>
{{--                                                    <td>--}}
{{--                                                        --}}{{-- Base fare will be single in a ride--}}
{{--                                                        @foreach($arr_invoice as $invoice)--}}
{{--                                                            @if(isset($invoice['parameterType']) && $invoice['parameterType'] == 10)--}}
{{--                                                                {{!empty($invoice) ? $invoice['value'] : 0}}--}}
{{--                                                            @endif--}}
{{--                                                        @endforeach--}}
{{--                                                    </td>--}}
{{--                                                    @foreach($arr_parameter as $param)--}}
{{--                                                        @if($param['parameterType'] != 13)--}}
{{--                                                            <td>{{isset($arr_invoice[$param['id']]) ? $arr_invoice[$param['id']]['value'] : 0}}</td>--}}
{{--                                                        @endif--}}
{{--                                                    @endforeach--}}
{{--                                                    <td>--}}

{{--                                                        @foreach($arr_invoice as $invoice)--}}
{{--                                                            @if($invoice['id'] == "Peak Time Charges" || $invoice['id'] == "Additional Mover Charger" || $invoice['id'] == "Cancellation")--}}
{{--                                                                {{$invoice['name']}} : {{$invoice['value']}} <br>--}}
{{--                                                            @endif--}}
{{--                                                        @endforeach--}}
{{--                                                        @lang("$string_file.total") : {{$transaction->extra_charges + $cancellation_amount + $additional_mover_amount}}--}}
{{--                                                    </td>--}}
{{--                                                    <td>--}}
{{--                                                        {{$transaction->sub_total_before_discount}}--}}
{{--                                                    </td>--}}
{{--                                                    <td>--}}
{{--                                                        {{$discount}}--}}
{{--                                                    </td>--}}
{{--                                                    <td>--}}
{{--                                                        {{($transaction->sub_total_before_discount - $discount) }}--}}
{{--                                                    </td>--}}
{{--                                                    @foreach($arr_parameter as $param)--}}
{{--                                                        --}}{{--only tax param--}}
{{--                                                        @if($param['parameterType'] == 13)--}}
{{--                                                            <td>{{ isset($arr_invoice[$param['id']]) ? $arr_invoice[$param['id']]['value'] : 0}}</td>--}}
{{--                                                        @endif--}}
{{--                                                    @endforeach--}}
{{--                                                    <td>--}}
{{--                                                        {{$tip}}--}}
{{--                                                    </td>--}}
{{--                                                    <td>--}}
{{--                                                        {{$toll}}--}}
{{--                                                    </td>--}}
{{--                                                    <td>--}}
{{--                                                        {{ $currency.' '.$corporate_charges}}--}}
{{--                                                    </td>--}}
                                                    <td>
                                                        {{ $currency.' '.$ride->final_amount_paid}}
                                                    </td>

                                                    <td>
                                                        {!! convertTimeToUSERzone($ride->created_at, $ride->CountryArea->timezone, null, $ride->Merchant) !!}
                                                    </td>
                                                </tr>
                                                @php $sr++  @endphp
                                            @endforeach
                                        </tbody>
                                        @endif
                                    </table>
                                    @include('merchant.shared.table-footer', ['table_data' => $arr_rides, 'data' => $arr_search])
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    @include('merchant.shared.info-setting',['info_setting'=>$info_setting,'page_name'=>'view_text'])
@endsection


@section('js')
<script>
    // JavaScript Function
    function getDepartmentUsers(dept_id) {
        if (!dept_id) {
            // Reset user dropdown if no department selected
            $('#user_id').html('<option value="">select user</option>');
            if ($('#user_id').hasClass('select2-hidden-accessible')) {
                $('#user_id').select2('destroy').select2();
            }
            return;
        }

        // Show loading state
        $('#user_id').html('<option value="">Loading...</option>');

        $.ajax({
            url:  '{{route("corporate.getDepartmentUsers")}}',
            type: 'GET',
            data: {
                department_id: dept_id
            },
            success: function(response) {
                let options = '<option value="">select user</option>';

                if (response.users && response.users.length > 0) {
                    response.users.forEach(function(user) {
                        options += `<option value="${user.id}">${user.first_name} ${user.last_name ?? ""} ( ${user.UserPhone} )</option>`;
                    });
                } else {
                    options = '<option value="">No users found</option>';
                }

                $('#user_id').html(options);

                // Reinitialize select2 if it's being used
                if ($('#user_id').hasClass('select2-hidden-accessible')) {
                    $('#user_id').select2('destroy').select2();
                }
            },
            error: function(xhr, status, error) {
                console.error('Error fetching users:', error);
                $('#user_id').html('<option value="">Error loading users</option>');
            }
        });
    }

    // Optional: Trigger on page load if department is already selected
    $(document).ready(function() {
        let selectedDept = $('#department_id').val();
        if (selectedDept) {
            getDepartmentUsers(selectedDept);

            // If there's a pre-selected user, set it after AJAX completes
            let selectedUserId = '{{ request("user_id") ?? (isset($arr_search["user_id"]) ? $arr_search["user_id"] : "") }}';
        if (selectedUserId) {
            setTimeout(function() {
                $('#user_id').val(selectedUserId);
                if ($('#user_id').hasClass('select2-hidden-accessible')) {
                    $('#user_id').trigger('change');
                }
            }, 500);
        }
    }
});
</script>
@endsection