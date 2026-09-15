@extends('corporate.layouts.main')
@section('content')
    <div class="page">
        <div class="page-content">
            @include('corporate.shared.errors-and-messages')
            <div class="panel panel-bordered">
                <header class="panel-heading">
                    <div class="panel-actions">
                        @if($export_permission)
                            <a href="{{route('excel.complete',$arr_search)}}" data-toggle="tooltip">
                                <button type="button" class="btn btn-icon btn-primary float-right"
                                        style="margin: 10px;">
                                    <i class="wb-download" title="@lang("$string_file.export_excel")"></i>
                                </button>
                            </a>
{{--                            <a href="{{route('corporate.master-invoice',$arr_search)}}" data-toggle="tooltip">--}}
{{--                                <button type="button" class="btn btn-icon btn-warning float-right" style="margin: 10px;"--}}
{{--                                        title="@lang("$string_file.master_invoice")">--}}
{{--                                    <i class="fa fa-print"></i>--}}
{{--                                </button>--}}
{{--                            </a>--}}
{{--                            <a href="{{route('corporate.multiple-invoice',$arr_search)}}" data-toggle="tooltip">--}}
{{--                                <button type="button" class="btn btn-icon btn-info float-right" style="margin: 10px;"--}}
{{--                                        title="@lang("$string_file.multiple_invoice")">--}}
{{--                                    <i class="fa fa-list"></i>--}}
{{--                                </button>--}}
{{--                            </a>--}}
                        @endif
                    </div>
                    <h3 class="panel-title"><i class="fa-taxi" aria-hidden="true"></i>
                        @lang("$string_file.pending") @lang("$string_file.rides") 
                    </h3>
                </header>
                <div class="panel-body container-fluid">
                    {!! $search_view !!}
                    <table id="customDataTable3" class="display nowrap table table-hover table-striped w-full"
                           style="width:100%">
                        <thead>
                        <tr>
                            <th>@lang("$string_file.sn")</th>
                            <th>@lang("$string_file.ride_id")</th>
                            <th>@lang("$string_file.ride_type") </th>
                            <th>@lang("$string_file.user_details")</th>
                            <th>@lang("$string_file.request_from")</th>
                            <th>@lang("$string_file.ride_details")</th>
                            <th>@lang("$string_file.pickup_drop")</th>
                            <th>@lang("$string_file.payment_method")</th>
                            <th>@lang("$string_file.estimate_bill")</th>
                            <th>@lang("$string_file.date")</th>
                            <th>@lang("$string_file.action")</th>
                        </tr>
                        </thead>
                        <tbody>
                        @php $sr = $all_bookings->firstItem() @endphp
                        @foreach($all_bookings as $booking)
                        {{-- @if(
                            (isset($booking->User->UserDetail) && $booking->User->UserDetail->is_default_corporate_user == 1)
                            || 
                            (isset($booking->User->UserDetail) 
                                && $booking->User->UserDetail->need_approval_for_corporate == 1 
                                && !empty($booking->corporate_ride_approver))
                            ||
                            (isset($booking->User->UserDetail) && empty(isset($booking->User->UserDetail->need_approval_for_corporate)))
                        ) --}}
                                <tr>
                                <td>{{ $sr }}</td>
                                <td>{{ $booking->merchant_booking_id }}</td>
                                <td>
                                    @if($booking->booking_type == 2 && isset($booking->BookingDetail) && $booking->BookingDetail->is_instant_corporate_ride == 1)
                                        @lang("$string_file.ride_now")
                                    @else
                                        @lang("$string_file.ride_later") <br>(
                                        {!! date(getDateTimeFormat($booking->Merchant->datetime_format,2),strtotime($booking->later_booking_date)) !!}
                                        {{$booking->later_booking_time }} )
                                    @endif
                                </td>
                                <td>
                                     <span class="long_text">
                                         {{ is_demo_data($booking->User->UserName, $booking->Merchant) }}<br>
                                         {{ is_demo_data($booking->User->UserPhone, $booking->Merchant) }}<br>
                                         {{ is_demo_data($booking->User->email, $booking->Merchant) }}
                                    </span>
                                </td>
                                <td>
                                    @switch($booking->platform)
                                        @case(1)
                                        @lang("$string_file.application")
                                        @break
                                        @case(2)
                                        @lang("$string_file.admin")
                                        @break
                                        @case(3)
                                        @lang("$string_file.web")
                                        @break
                                    @endswitch
                                </td>
                                @php
                                    $package_name = ($booking->service_type_id == 2) && !empty($booking->service_package_id) ? ' ('.$booking->ServicePackage->PackageName.')' : '';
                                    $service_text = ($booking->ServiceType) ? $booking->ServiceType->serviceName($booking->merchant_id).$package_name : ($booking->deliveryType ? $booking->deliveryType->name : '---' );
                                @endphp
                                <td>{!! nl2br($booking->CountryArea->CountryAreaName ."\n". $service_text."\n".$booking->VehicleType->VehicleTypeName) !!}</td>

                                <td>
                                    <a title="{{ $booking->pickup_location }}" target="_blank"
                                               href="https://www.google.com/maps/place/{{ $booking->pickup_latitude }},{{ $booking->pickup_longitude }}"
                                               class="btn btn-icon btn-success ml-20"><i class="icon wb-map"></i></a>
                                            <a title="{{ $booking->drop_location }}" target="_blank"
                                               href="https://www.google.com/maps/place/{{ $booking->drop_latitude }},{{ $booking->drop_longitude }}"
                                               class="btn btn-icon btn-danger ml-20"><i class="icon fa-tint"></i></a>
                                </td>
                                <td>
                                    {{ $booking->PaymentMethod->payment_method }}
                                </td>
                                <td>
                                    {{ $booking->estimate_distance }}<br>
                                    @php
                                        $corporate_amount = 0;
                                       if(isset($booking->BookingDetail) && !empty($booking->BookingDetail->manual_corporate_fee)){
                                            $corporate_amount = $booking->BookingDetail->manual_corporate_fee;
                                        }
                                        else{
                                            $corporate_amount = ($booking->Corporate->corporate_fee_method == 1) ? $booking->Corporate->corporate_fee : ($booking->Corporate->corporate_fee * $booking->estimate_bill) / 100;
                                        }
                                    @endphp
                                    {{$booking->CountryArea->Country->isoCode . ($booking->estimate_bill+$corporate_amount) }}
                                </td>
                                <td>
                                    {!! convertTimeToUSERzone($booking->created_at, $booking->CountryArea->timezone,null,$booking->Merchant) !!}

                                </td>
                                <td>
                                  {{-- @if($booking->upcoming_notify == 0 && $booking->booking_status == 1019 || empty($booking->driver_id))
                                        <a target="_blank" title="@lang("$string_file.manual_assign")"
                                       href="{{ route('corporate.ride-later.manual-assign',$booking->id) }}"
                                       class="btn btn-sm btn-success menu-icon btn_detail action_btn"><span
                                                class="fa fa-list-alt"></span></a>
                                   @endif --}}
                                   <a href="{{route('approve.corporate.ride', ['booking_id'=>$booking->id, 'approver'=>$default_corporate_user->id])}}"
                                   class="btn btn-success btn-sm">
                                   Approve
                                </a>
                                </td>
                            </tr>
                            {{-- @endif --}}
                            @php $sr++  @endphp
                        @endforeach
                        </tbody>
                    </table>
                   @include('merchant.shared.table-footer', ['table_data' => $all_bookings, 'data' => $arr_search])
                </div>
            </div>
        </div>
    </div>
@endsection