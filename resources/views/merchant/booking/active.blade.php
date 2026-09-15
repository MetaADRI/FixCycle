@extends('merchant.layouts.main')
@section('content')
    <div class="page">
        <div class="page-content">
            @include('merchant.shared.errors-and-messages')
            <div class="panel panel-bordered">
                <header class="panel-heading">
                    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
                    <div class="panel-actions">
                        @if(!empty($info_setting) && $info_setting->view_text != "")
                            <button class="btn btn-icon btn-primary float-right" style="margin:10px"
                                    data-target="#examplePositionSidebar" data-toggle="modal" type="button">
                                <i class="wb-info ml-1 mr-1" title="Info" style=""></i>
                            </button>
                        @endif
                        @if($export_permission)
                            <a href="{{route('excel.ridenow',$arr_search)}}" data-toggle="tooltip">
                                <button type="button" class="btn btn-icon btn-primary float-right" style="margin:10px">
                                    <i class="wb-download"
                                       title="@lang("$string_file.export_excel")"></i>
                                </button>
                            </a>
                        @endif
                    </div>
                    <h3 class="panel-title"><i class="wb-flag" aria-hidden="true"></i>
                        @lang("$string_file.ongoing_rides")
                    </h3>
                </header>
                <div class="panel-body container-fluid">
                    <div class="tab-content pt-20">
                        <div class="tab-pane active" id="exampleTabsLineTopOne" role="tabpanel">
                            {!! $search_view !!}
                            <table id="customDataTable" class="display nowrap table table-hover table-striped w-full"
                                   style="width:100%">
                                <thead>
                                <tr>
                                    <th>@lang("$string_file.sn")</th>
                                    <th>@lang("$string_file.ride_id")</th>
                                    <th>@lang("$string_file.ride_type")</th>
                                    @if(isset($bookingConfig->ride_otp) && $bookingConfig->ride_otp == 1)
                                        <th>@lang("$string_file.otp")</th>
                                    @endif
                                    <th>@lang("$string_file.current_status")</th>
                                    <th>@lang("$string_file.user_details")</th>
                                    <th>@lang("$string_file.driver_details")</th>
                                    <th>@lang("$string_file.request_from")</th>
                                    <th>@lang("$string_file.ride_details")</th>
                                    <th>@lang("$string_file.pickup_drop")</th>
                                    <th>@lang("$string_file.estimate_bill")</th>
                                    <th>@lang("$string_file.payment_method")</th>
                                    <th>@lang("$string_file.date")</th>
                                    <th>@lang("$string_file.action")</th>
                                </tr>
                                </thead>
                                <tbody>
                                @php $sr = $all_bookings->firstItem() @endphp
                                @foreach($all_bookings as $booking)
                                    <tr>
                                        <td>
                                            {{ $sr }}
                                        </td>
                                        <td>
                                            <a class="address_link"
                                               href="{{ route('merchant.booking.details',$booking->id) }}">{{ $booking->merchant_booking_id }} </a>
                                        </td>
                                        <td>
                                            @if($booking->booking_type == 1)
                                                @lang("$string_file.ride_now")
                                            @else
                                                @lang("$string_file.ride_later")<br>(
                                                {!! date(getDateTimeFormat($booking->Merchant->datetime_format,2),strtotime($booking->later_booking_date)) !!}
                                                <br>
                                                {{$booking->later_booking_time }} )
                                            @endif
                                                @if(!empty($booking->corporate_id))
                                                    <br><span class="badge badge-info"> @lang("$string_file.corporate") | {{$booking->Corporate->corporate_name}} </span>
                                                @endif
                                        </td>
                                        @if(isset($bookingConfig->ride_otp) && $bookingConfig->ride_otp == 1)
                                            <td>{{ isset($booking->ride_otp) ? $booking->ride_otp : '--' }}</td>
                                        @endif
                                        <td style="text-align: center">
                                            @if(!empty($arr_booking_status))
                                                <b>{!! isset($arr_booking_status[$booking->booking_status]) ? $arr_booking_status[$booking->booking_status] : ""  !!}</b>
                                                <br>
                                            @endif

                                            @if(!empty($booking->BookingDetail->accept_timestamp))  @lang("$string_file.accepted") {{ convertTimeToUSERzone(date("Y-m-d H:i:s",$booking->BookingDetail->accept_timestamp), $booking->CountryArea->timezone,null,$booking->Merchant,3) }} <br> @endif
                                            @if(!empty($booking->BookingDetail->arrive_timestamp)) @lang("$string_file.arrived") {{ convertTimeToUSERzone(date("Y-m-d H:i:s",$booking->BookingDetail->arrive_timestamp), $booking->CountryArea->timezone,null,$booking->Merchant,3) }}  <br>  @endif
                                            @if(!empty($booking->BookingDetail->start_timestamp)) @lang("$string_file.started") {{ convertTimeToUSERzone(date("Y-m-d H:i:s",$booking->BookingDetail->start_timestamp), $booking->CountryArea->timezone,null,$booking->Merchant,3) }} <br> @endif
                                            @if(!empty($booking->BookingDetail->end_timestamp)) @lang("$string_file.completed") convertTimeToUSERzone(date("Y-m-d H:i:s",$booking->BookingDetail->end_timestamp), $booking->CountryArea->timezone,null,$booking->Merchant,3) }} <br> @endif
                                        </td>

                                        <td>
                                            @php
                                                    $user_total_booking = \App\Models\Booking::whereIn("booking_status", [1005])->where("user_id", $booking->User->id)->where("merchant_id",$booking->User->merchant_id)->count();
                                            @endphp
                                            <span class="long_text">
                                                {{ is_demo_data($booking->User->UserName, $booking->Merchant) }}
                                                <br>
                                                {{ is_demo_data($booking->User->UserPhone, $booking->Merchant) }}
                                                <br>
                                                {{ is_demo_data($booking->User->email, $booking->Merchant) }}
                                                <br>
                                                @lang("$string_file.completed") @lang("$string_file.bookings") : <strong> {{ $user_total_booking }}</strong>
                                            </span>
                                        </td>
                                        <td>
                                            @php
                                                    if(isset($booking->Driver))
                                                            $driver_total_booking = \App\Models\Booking::whereIn("booking_status", [1005])->where("driver_id", $booking->Driver->id)->where("merchant_id",$booking->Driver->merchant_id)->count();
                                                    else
                                                            $driver_total_booking = NULL;
                                            @endphp
                                             <span class="long_text">
                                                @if($booking->Driver)
                                                     {{ is_demo_data($booking->Driver->fullName, $booking->Merchant) }}
                                                     <br>
                                                     {{ is_demo_data($booking->Driver->phoneNumber, $booking->Merchant) }}
                                                     <br>
                                                     {{ is_demo_data($booking->Driver->email, $booking->Merchant) }}
                                                     <br>
                                                      @lang("$string_file.completed") @lang("$string_file.bookings") : <strong>{{ $driver_total_booking }}</strong>
                                                 @else
                                                     @lang("$string_file.not_assigned_yet")
                                                 @endif
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
                                            $service_text = ($booking->ServiceType) ? $booking->ServiceType->serviceName : ($booking->deliveryType ? $booking->deliveryType->name : '---' );
                                            $vehicle_number = isset($booking->DriverVehicle) ? $booking->DriverVehicle->vehicle_number : "";
                                        @endphp
                                        <td>
                                            {!! nl2br($booking->CountryArea->CountryAreaName ."\n". $service_text."\n".$booking->VehicleType->VehicleTypeName."\n".$vehicle_number) !!}

                                        </td>

                                        <td>
                                            @if(!empty($booking->pickup_location))
                                            <a title="{{ $booking->pickup_location }}" target="_blank"
                                               href="https://www.google.com/maps/place/{{ $booking->pickup_latitude }},{{ $booking->pickup_longitude}}"
                                               class="btn btn-icon btn-success ml-20"><i class="icon wb-map"></i></a>
                                            @endif
                                            @if(!empty($booking->drop_location))
                                            <a title="{{ $booking->drop_location }}" target="_blank"
                                               href="https://www.google.com/maps/place/{{ $booking->drop_latitude }},{{ $booking->drop_longitude}}"
                                               class="btn btn-icon btn-danger ml-20"><i class="icon fa-tint"></i></a>
                                            @endif
                                        </td>
                                        @php

                                            $promocode = $booking->PromoCode;
                                             $promo_name = "";
                                             $promo_code_discount = null;

                                             if (!empty($promocode)) {
                                                 $promo_name = $promocode->getPromoNameAttribute();
                                                 if ($promocode->promo_code_value_type == 1) {
                                                     // Flat discount
                                                     if ($booking->estimate_bill < $promocode->promo_code_value) {
                                                         $promo_code_discount = 0.00;
                                                     } else {
                                                         $promo_code_discount = $promocode->promo_code_value;
                                                     }
                                                 } else {
                                                     // Percentage discount
                                                     $promo_code_discount = round(($booking->estimate_bill * $promocode->promo_code_value) / 100, 2);

                                                     if ($promo_code_discount > $promocode->promo_percentage_maximum_discount) {
                                                         $promo_code_discount = $promocode->promo_percentage_maximum_discount;
                                                     }
                                                 }
                                             }

                                        @endphp
                                        <td>
                                            {{ $booking->estimate_distance }}<br>
                                            ~ {{$booking->CountryArea->Country->isoCode . $booking->estimate_bill }}
                                            @php
                                                $corporate_amount = getCorporateCharges($booking);
                                            @endphp

                                            @if(!empty($booking->corporate_id))
                                                <br><span class="badge badge-warning"> @lang("$string_file.corporate_charges") {{$corporate_amount}}</span>
                                            @endif
                                            @if(!empty($promo_name) && !empty($promo_code_discount))
                                                <br>

                                                @lang("$string_file.promo_code")
                                                {{$promo_name}}<br>
                                                {{$booking->CountryArea->Country->isoCode}} {{$promo_code_discount}}
                                            @endif
                                        </td>
                                        <td>
                                            {{ $booking->PaymentMethod->payment_method }}
                                        </td>

                                        <td>
                                            {!! convertTimeToUSERzone($booking->created_at, $booking->CountryArea->timezone,null,$booking->Merchant) !!}
                                            {{--                                                {{ $booking->created_at->toDateString() }}--}}
                                            {{--                                                <br>--}}
                                            {{--                                                {{ $booking->created_at->toTimeString() }}--}}
                                        </td>
                                        <td>
                                            <a target="_blank"
                                               title=""
                                               href="{{ route('merchant.ride-requests',$booking->id) }}"
                                               class="btn btn-sm btn-primary menu-icon btn_detail action_btn"><span
                                                        class="fa fa-list-alt"
                                                        data-original-title="@lang("$string_file.requested_drivers")"
                                                        data-toggle="tooltip"
                                                        data-placement="top"></span></a>
                                            <a target="_blank"
                                               title=""
                                               href="{{ route('merchant.booking.details',$booking->id) }}"
                                               class="btn btn-sm btn-info menu-icon btn_money action_btn"><span
                                                        class="fa fa-info-circle"
                                                        data-original-title="@lang("$string_file.ride_details")"
                                                        data-toggle="tooltip"
                                                        data-placement="top"></span></a>
                                            @if(!in_array($booking->booking_status,[1005]))
                                                <span data-target="#cancelbooking"
                                                      data-toggle="modal"
                                                      id="{{ $booking->id }}"><a
                                                            data-original-title="@lang("$string_file.cancel_ride")"
                                                            data-toggle="tooltip"
                                                            id="{{ $booking->id }}"
                                                            data-placement="top"
                                                            class="btn btn-sm btn-danger menu-icon btn_delete action_btn"> <i
                                                                class="fa fa-times"></i> </a></span>
                                            @endif
                                            {{--                                            <span data-target="#completebooking"--}}
                                            {{--                                                  data-toggle="modal"--}}
                                            {{--                                                  id="{{ $booking->id }}"><a--}}
                                            {{--                                                        data-original-title="@lang("$string_file.complete_ride")"--}}
                                            {{--                                                        data-toggle="tooltip"--}}
                                            {{--                                                        id="{{ $booking->id }}"--}}
                                            {{--                                                        data-placement="top"--}}
                                            {{--                                                        class="btn btn-sm btn-success menu-icon btn_delete action_btn"> <i--}}
                                            {{--                                                            class="fa fa-check"></i> </a></span>--}}
                                            @if(!in_array($booking->booking_status,[1001,1012]))
                                                <a target="_blank"
                                                   title=""
                                                   href="{{ route('merchant.activeride.track',$booking->id) }}"
                                                   class="btn btn-sm btn-success menu-icon btn_money action_btn"><span
                                                            class="fa fa-map-marker"
                                                            data-original-title="@lang("$string_file.track_ride")"
                                                            data-toggle="tooltip"
                                                            data-placement="top"></span></a>
                                            @endif
                                            @if($booking->booking_status == 1005 && $booking->booking_closure != 1)
                                                <span data-target="#ratebooking"
                                                      data-toggle="modal"
                                                      id="{{ $booking->id }}"><a
                                                            data-original-title="@lang("$string_file.rating") "
                                                            data-toggle="tooltip"
                                                            id="{{ $booking->id }}"
                                                            data-placement="top"
                                                            class="btn btn-sm btn-info menu-icon action_btn rating_btn"> <i
                                                                class="fa fa-star-half-empty"></i> </a></span>
                                            @endif
                                            @if($booking->booking_status == 1004)
                                                <span data-target="#endride"
                                                      data-toggle="modal"
                                                      id="{{ $booking->id }}"><a
                                                            data-original-title="@lang("$string_file.end_ride")"
                                                            data-toggle="tooltip"
                                                            id="{{ $booking->id }}"
                                                            data-placement="top"
                                                            class="btn btn-sm btn-danger menu-icon action_btn"> <i class="fa fa-stop"></i></a></span>
                                            @endif
                                        </td>
                                    </tr>
                                    @php $sr++ @endphp
                                @endforeach
                                </tbody>
                            </table>
                            @include('merchant.shared.table-footer', ['table_data' => $all_bookings, 'data' => $arr_search])
                            {{--                                <div class="pagination1 float-right">{{ $bookings->links() }}</div>--}}
                        </div>

                    </div>
                    {{--                    </div>--}}
                </div>
            </div>
        </div>
    </div>
    <div class="modal fade text-left" id="cancelbooking" tabindex="-1" role="dialog" aria-labelledby="myModalLabel33"
         aria-hidden="true">
        <div class="modal-dialog" role="document">
            <div class="modal-content">
                <div class="modal-header">
                    <label class="modal-title text-text-bold-600"
                           id="myModalLabel33">@lang("$string_file.cancel_ride")</label>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <form action="{{ route('merchant.cancelbooking') }}" method="post">
                    @csrf
                    <div class="modal-body">
                        <div class="form-group">
                            <select class="form-control" name="cancel_reason_id" required>
                                <option value="">@lang("$string_file.cancel_reason")</option>
                                @foreach($cancelreasons as $cancelreason )
                                    <option value="{{ $cancelreason->id }}">{{ $cancelreason->ReasonName }}</option>
                                @endforeach
                            </select>
                        </div>

                        <label>@lang("$string_file.additional_notes"): </label>
                        <div class="form-group">
                            <textarea class="form-control" id="title1" rows="3" name="description"
                                      placeholder=""></textarea>
                        </div>
                        <input type="hidden" name="booking_id" id="booking_id" value="">

                    </div>
                    <div class="modal-footer">
                        <input type="reset" class="btn btn-secondary" data-dismiss="modal"
                               value="@lang("$string_file.close")">
                        <input type="submit" class="btn btn-primary" value="@lang("$string_file.save")">
                    </div>
                </form>
            </div>
        </div>
    </div>
    <div class="modal fade text-left" id="endride" tabindex="-1" role="dialog" aria-labelledby="myModalLabel33"
         aria-hidden="true">
        <div class="modal-dialog" role="document">
            <div class="modal-content">
                <div class="modal-header">
                    <label class="modal-title text-text-bold-600"
                           id="myModalLabel33">@lang("$string_file.end_ride")</label>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <form action="{{ route('merchant.endride') }}" method="post">
                    @csrf
                    <div class="modal-body">
                        <p>Are you sure you want to end ride ?</p>
                        <input type="hidden" name="booking_id" id="booking_id" value="">
                    </div>
                    <div class="modal-footer">
                        <input type="reset" class="btn btn-secondary" data-dismiss="modal"
                               value="@lang("$string_file.close")">
                        <input type="submit" class="btn btn-primary" value="@lang("$string_file.end_ride")">
                    </div>
                </form>
            </div>
        </div>
    </div>
    {{--    <div class="modal fade text-left" id="completebooking" tabindex="-1" role="dialog" aria-labelledby="myModalLabelCompleteBooking"--}}
    {{--         aria-hidden="true">--}}
    {{--        <div class="modal-dialog modal-dialog-centered" role="document">--}}
    {{--            <div class="modal-content">--}}
    {{--                <div class="modal-header">--}}
    {{--                    <label class="modal-title text-text-bold-600"--}}
    {{--                           id="myModalLabelCompleteBooking">@lang("$string_file.complete_ride")</label>--}}
    {{--                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">--}}
    {{--                        <span aria-hidden="true">&times;</span>--}}
    {{--                    </button>--}}
    {{--                </div>--}}
    {{--                <form action="{{ route('merchant.completebooking') }}" method="post">--}}
    {{--                    @csrf--}}
    {{--                    <div class="modal-body">--}}
    {{--                        <div class="form-group">--}}
    {{--                            <div class="row">--}}
    {{--                                <div class="col-md-12">--}}
    {{--                                    <h3 class="text-center">Are You Sure?</h3>--}}
    {{--                                    <h4 class="text-center">You want to complete this Ride?</h4>--}}
    {{--                                </div>--}}
    {{--                            </div>--}}
    {{--                        </div>--}}
    {{--                        <input type="hidden" name="booking_id" id="booking_id" value="">--}}
    {{--                    </div>--}}
    {{--                    <div class="modal-footer">--}}
    {{--                        <input type="reset" class="btn btn-danger" data-dismiss="modal"--}}
    {{--                               value="@lang("$string_file.no")">--}}
    {{--                        <input type="submit" class="btn btn-success" value="@lang("$string_file.yes")">--}}
    {{--                    </div>--}}
    {{--                </form>--}}
    {{--            </div>--}}
    {{--        </div>--}}
    {{--    </div>--}}
    <div class="modal fade text-left" id="ratebooking" tabindex="-1" role="dialog" aria-labelledby="myModalLabel33"
         aria-hidden="true">
        <div class="modal-dialog" role="document">
            <div class="modal-content">
                <div class="modal-header">
                    <label class="modal-title text-text-bold-600"
                           id="myModalLabel33">@lang("$string_file.rating")</label>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <form action="{{ route('merchant.booking.rating') }}" method="post">
                    @csrf
                    <div class="modal-body">
                        <div class="form-group">
                            <input type="number" class="form-control" id="rating" name="rating"
                                   placeholder=""/>
                        </div>
                        <label>@lang("$string_file.comment") : </label>
                        <div class="form-group">
                            <textarea class="form-control" id="comment" rows="3" name="comment"
                                      placeholder=""></textarea>
                        </div>
                        <input type="hidden" name="rating_booking_id" id="rating_booking_id" value="">
                    </div>
                    <div class="modal-footer">
                        <input type="reset" class="btn btn-secondary" data-dismiss="modal"
                               value="@lang("$string_file.close")">
                        <input type="submit" class="btn btn-primary" value="@lang("$string_file.save")">
                    </div>
                </form>
            </div>
        </div>
    </div>
    <div class="modal fade" id="examplePositionSidebar" aria-labelledby="examplePositionSidebar"
         role="dialog" tabindex="-1" aria-hidden="true" style="display: none;">
        <div class="modal-dialog modal-simple modal-sidebar modal-sm">
            <div class="modal-content">
                <div class="modal-header">
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">×</span>
                    </button>
                    {{--                    <h4 class="modal-title">Country</h4>--}}
                </div>
                <div class="modal-body">
                    @if(!empty($info_setting) && $info_setting->view_text != "")
                        {!! $info_setting->view_text !!}
                    @else
                        <p>No information content found...</p>
                    @endif
                </div>
            </div>
        </div>
    </div>
@endsection
@section('js')
    <script>
        $(document).ready(function () {
            $('#dataTable2').DataTable({
                searching: false,
                paging: false,
                info: false,
                "bSort": false,
            });
            $(".rating_btn").on('click', function () {
                $('#rating_booking_id').val($(this).attr('id'));
            });
        });
        $('#completebooking').on('show.bs.modal', function (e) {
            let $modal = $(this),
                esseyId = e.relatedTarget.id;
            $modal.find('#booking_id').val(esseyId);
        });
        $('#endride').on('show.bs.modal', function (e) {
            let $modal = $(this),
                esseyId = e.relatedTarget.id;
            $modal.find('#booking_id').val(esseyId);
        });
    </script>
@endsection
