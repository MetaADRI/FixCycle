@extends('corporate.layouts.main')
@section('content')
    <div class="page">
        <div class="page-content">
            @if(session('noridecompleteexport'))
                <div class="alert dark alert-icon alert-info alert-dismissible" role="alert">
                    <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                        <span aria-hidden="true">x</span>
                    </button>
                    <i class="icon wb-info" aria-hidden="true"></i>@lang('admin.message448')
                </div>
            @endif
            <div class="panel panel-bordered">
                <header class="panel-heading">
                    <div class="panel-actions">
                        <a href="{{route('corporate.excel.completed')}}" data-toggle="tooltip">
                            <button type="button" class="btn btn-icon btn-primary float-right" style="margin:10px">
                                <i class="wb-download"
                                   title="@lang("$string_file.export_excel")"></i>
                            </button>
                        </a>
                    </div>
                    <h3 class="panel-title"><i class="wb-flag" aria-hidden="true"></i>
                        @lang("$string_file.completed_rides") </h3>
                </header>
                <div class="panel-body container-fluid">
                    <form action="{{ route('corporate.completeride') }}" method="GET">
                        <div class="table_search row">
                            <div class="col-md-1 col-xs-12 form-group active-margin-top">
                                @lang("$string_file.search_by"):
                            </div>
                            <div class="col-md-2 col-xs-12 form-group active-margin-top">
                                <div class="input-group">
                                    <input type="text"
                                           name="booking_id"
                                           value="{{ request('booking_id') }}"
                                           placeholder="@lang("$string_file.ride_id")"
                                           class="form-control col-md-12 col-xs-12">
                                </div>
                            </div>
                            <div class="col-md-2 col-xs-12 form-group active-margin-top">
                                <div class="input-group">
                                    <input type="text"
                                           name="rider"
                                           value="{{ request('rider') }}"
                                           placeholder="@lang("$string_file.user_details")"
                                           class="form-control col-md-12 col-xs-12">
                                </div>
                            </div>
                            <div class="col-md-2 col-xs-12 form-group active-margin-top">
                                <div class="input-group">
                                    <input type="text"
                                           name="driver"
                                           value="{{ request('driver') }}"
                                           placeholder="@lang("$string_file.driver_details")"
                                           class="form-control col-md-12 col-xs-12">
                                </div>
                            </div>
                            <div class="col-md-4 col-xs-12 form-group active-margin-top">
                                <div class="input-daterange" data-plugin="datepicker">
                                    <div class="input-group">
                                        <div class="input-group-prepend">
                        <span class="input-group-text">
                            <i class="icon wb-calendar" aria-hidden="true"></i>
                        </span>
                                        </div>
                                        <input type="text"
                                               class="form-control"
                                               name="date"
                                               placeholder="@lang("$string_file.from")"
                                               value="{{ request('date') }}" />
                                    </div>
                                    <div class="input-group">
                                        <div class="input-group-prepend">
                                            <span class="input-group-text">to</span>
                                        </div>
                                        <input type="text"
                                               class="form-control"
                                               name="date1"
                                               placeholder="@lang("$string_file.to")"
                                               value="{{ request('date1') }}" />
                                    </div>
                                </div>
                            </div>

                            <div class="col-sm-1 col-xs-12 form-group active-margin-top">
                                <button class="btn btn-primary" type="submit" name="seabt12">
                                    <i class="fa fa-search" aria-hidden="true"></i>
                                </button>
                            </div>

                            <div class="col-sm-2 col-xs-12 form-group active-margin-top">
                                <button class="btn btn-primary" type="submit" name="seabt12">
                                    <i class="fa fa-search" aria-hidden="true"></i>
                                </button>
                                <a href="{{ route('corporate.completeride') }}" class="btn btn-secondary">
                                    <i class="fa fa-refresh" aria-hidden="true"></i>
                                </a>
                            </div>

                        </div>
                    </form>

                    <table id="customDataTable" class="display nowrap table table-hover table-striped w-full" style="width:100%">
                        <thead>
                        <tr>
                            <th>@lang("$string_file.ride_id")</th>
                            <th>@lang("$string_file.ride_type")</th>
                            <th>@lang("$string_file.user_details")</th>
                            <th>@lang("$string_file.driver_details")</th>
                            <th>@lang("$string_file.request_from")</th>
                            <th>@lang("$string_file.ride_details")</th>
                            <th>@lang("$string_file.pickup_drop")</th>
                            <th>@lang("$string_file.payment_method")</th>
                            <th>@lang("$string_file.bill_amount")</th>
                            <th>@lang("$string_file.date")</th>
                            <th>@lang("$string_file.action")</th>
                        </tr>
                        </thead>
                        <tbody>
                        @foreach($bookings as $booking)
                            <tr>
                                <td>{{ $booking->merchant_booking_id }}</td>
                                <td>
                                    @if($booking->booking_type == 2 && isset($booking->BookingDetail) && $booking->BookingDetail->is_instant_corporate_ride == 1)
                                        @lang("$string_file.ride_now")
                                    @else
                                        @lang("$string_file.ride")  @lang("$string_file.later")
                                    @endif
                                </td>

                                @if(Auth::user()->Merchant->demo == 1)
                                    <td>
                                                         <span class="long_text">
                                                        {{ "********".substr($booking->User->UserName,-2) }}
                                                        <br>
                                                        {{ "********".substr($booking->User->UserPhone,-2) }}
                                                        <br>
                                                        {{ "********".substr($booking->User->email,-2) }}
                                                        </span>
                                    </td>
                                    <td>
                                                         <span class="long_text">
                                                         {{ "********".substr($booking->Driver->last_name,-2) }}

                                                        </span>
                                    </td>
                                @else
                                    <td>
                                                         <span class="long_text">
                                                        {{ $booking->User->UserName }}
                                                        <br>
                                                        {{ $booking->User->UserPhone }}
                                                        <br>
                                                        {{ $booking->User->email }}
                                                        </span>
                                    </td>
                                    <td>
                                                         <span class="long_text">
                                                         {{ $booking->Driver->first_name.' '.$booking->Driver->last_name }}

                                                        </span>
                                    </td>
                                @endif

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
                                    $service_text = ($booking->ServiceType) ? $booking->ServiceType->serviceName : $booking->deliveryType->name ;
                                @endphp
                                <td>{!! nl2br($booking->CountryArea->CountryAreaName ."\n". $service_text."\n".$booking->VehicleType->VehicleTypeName) !!}</td>

                                <td>
                                    @if(!empty($booking->BookingDetail->start_location))
                                        <a title="{{ $booking->BookingDetail->start_location}}" target="_blank"
                                           href="https://www.google.com/maps/place/{{ $booking->BookingDetail->start_latitude}},{{ $booking->BookingDetail->start_longitude}}"
                                           class="btn btn-icon btn-success ml-20"><i class="icon wb-map"></i></a>
                                    @endif
                                    @if(!empty($booking->BookingDetail->end_location))
                                        <a title="{{ $booking->BookingDetail->end_location }}" target="_blank"
                                           href="https://www.google.com/maps/place/{{ $booking->BookingDetail->end_latitude}},{{ $booking->BookingDetail->end_longitude}}"
                                           class="btn btn-icon btn-danger ml-20"><i class="icon fa-tint"></i></a>
                                    @endif
                                </td>



                                <td>
                                    {{ $booking->PaymentMethod->payment_method }}
                                </td>
                                <td>
                                    {{ $booking->CountryArea->Country->isoCode . $booking->final_amount_paid }}
                                </td>
                                <td>
                                    {!! convertTimeToUSERzone($booking->created_at, $booking->CountryArea->timezone, null,$booking->Merchant, 5, 1) !!}
                                </td>
                                <td>
                                    <a target="_blank" title="@lang("$string_file.requested_drivers")"
                                       href="{{ route('corporate.ride-requests',$booking->id) }}"
                                       class="btn btn-sm btn-success menu-icon btn_detail action_btn"><span
                                                class="fa fa-list-alt"></span></a>

                                    <a target="_blank" title="@lang("$string_file.ride_details")"
                                       href="{{ route('corporate.booking.details',$booking->id) }}"
                                       class="btn btn-sm btn-info menu-icon btn_money action_btn"><span
                                                class="fa fa-info-circle"
                                                title="Booking Details"></span></a>

                                    <a target="_blank" title="@lang('"$string_file.invoice"')"
                                       href="{{ route('corporate.booking.invoice',$booking->id) }}"
                                       class="btn btn-sm btn-warning menu-icon btn_eye action_btn"><span
                                                class="fa fa-print"></span></a>
                                </td>
                            </tr>
                        @endforeach
                        </tbody>
                    </table>
                    <div class="pagination1 float-right">{{ $bookings->links() }}</div>
                </div>
            </div>
        </div>
    </div>
@endsection
