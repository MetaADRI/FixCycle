@extends('merchant.layouts.main')
@section('content')
    <div class="page">
        <div class="page-content">
            @include('merchant.shared.errors-and-messages')
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
                            <a href="{{route('merchant.master-invoice',$arr_search)}}" data-toggle="tooltip">
                                <button type="button" class="btn btn-icon btn-warning float-right" style="margin: 10px;"
                                        title="@lang("$string_file.master_invoice")">
                                    <i class="fa fa-print"></i>
                                </button>
                            </a>
                            <a href="{{route('merchant.multiple-invoice',$arr_search)}}" data-toggle="tooltip">
                                <button type="button" class="btn btn-icon btn-info float-right" style="margin: 10px;"
                                        title="@lang("$string_file.multiple_invoice")">
                                    <i class="fa fa-list"></i>
                                </button>
                            </a>
                        @endif
                    </div>
                    <h3 class="panel-title"><i class="fa-taxi" aria-hidden="true"></i>
                        @lang("$string_file.completed_rides")
                    </h3>
                </header>
                <div class="panel-body container-fluid">
                    {!! $search_view !!}
                    <table id="customDataTable" class="display nowrap table table-hover table-striped w-full"
                           style="width:100%">
                        <thead>
                        <tr>
                            <th>@lang("$string_file.sn")</th>
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
                        @php $sr = $bookings->firstItem() @endphp
                        @foreach($bookings as $booking)
                            <tr>
                                <td>{{ $sr }}</td>
                                <td>{{ $booking->merchant_booking_id }}</td>
                                <td>
                                    
                                    
                                    @if($booking->booking_type == 1)
                                        @lang("$string_file.ride_now")
                                    @else
                                        @lang("$string_file.ride_later") <br>(
                                        {!! date(getDateTimeFormat($booking->Merchant->datetime_format,2),strtotime($booking->later_booking_date)) !!}
                                        {{$booking->later_booking_time }} )
                                    @endif
                                    
                                    
                                    @if(!empty($booking->corporate_id))
                                        <br>
                                        <span class="badge bg-primary">
                                            @lang("$string_file.corporate") | {{$booking->Corporate->corporate_name}}
                                        </span>
                                    @endif

                                </td>

                                <td>
                                     @php
                                            $user_total_booking = \App\Models\Booking::whereIn("booking_status", [1005])->where("user_id", $booking->user_id)->where("merchant_id",$booking->merchant_id)->count();
                                    @endphp
                                     <span class="long_text">
                                         {{ is_demo_data($booking->User->UserName, $booking->Merchant) }}<br>
                                         {{ is_demo_data($booking->User->UserPhone, $booking->Merchant) }}<br>
                                         {{ is_demo_data($booking->User->email, $booking->Merchant) }}
                                    </span>
                                    <br>
                                        @lang("$string_file.completed") @lang("$string_file.bookings") : <strong> {{ $user_total_booking }}</strong>
                                    <br>
                                        @if($booking->merchant_id == 976 && !empty($booking->user_device_details))
                                            Unique Number : <strong> {{ $booking->user_device_details['user_unique_number'] }}</strong>

                                            @if(isset($booking->user_device_details['exist']) && $booking->user_device_details['exist'] == 0)

                                                <br><span class="badge badge-success"> Unique Identified </span>
                                            @endif
                                        @endif
                                        
                                </td>
                                <td>
                                    @php
                                            if(isset($booking->Driver))
                                                    $driver_total_booking = \App\Models\Booking::whereIn("booking_status", [1005])->where("driver_id", $booking->driver_id)->where("merchant_id",$booking->merchant_id)->count();
                                            else
                                                    $driver_total_booking = NULL;
                                    @endphp
                                    <span class="long_text">
                                        {{ is_demo_data($booking->Driver->fullName, $booking->Merchant) }}<br>
                                        {{ is_demo_data($booking->Driver->phoneNumber, $booking->Merchant) }}<br>
                                        {{ is_demo_data($booking->Driver->email, $booking->Merchant) }}
                                    </span>
                                    <br>
                                       @lang("$string_file.completed") @lang("$string_file.bookings") : <strong>{{ $driver_total_booking }}</strong>
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
                                    @if(!empty($booking->BookingDetail->start_location))
                                        <a title="{{ $booking->BookingDetail->start_location }}"
                                           target="_blank"
                                           href="https://www.google.com/maps/place/{{ $booking->BookingDetail->start_latitude}},{{ $booking->BookingDetail->start_longitude}}"
                                           class="btn btn-icon btn-success ml-2  0"><i class="icon wb-map"></i></a>
                                    @endif
                                    @if(!empty($booking->BookingDetail->end_location))
                                        <a title="{{ $booking->BookingDetail->end_location }}"
                                           target="_blank"
                                           href="https://www.google.com/maps/place/{{ $booking->BookingDetail->end_latitude}},{{ $booking->BookingDetail->end_longitude}}"
                                           class="btn btn-icon btn-danger ml-20"><i class="icon fa-tint"></i></a>
                                    @endif
                                </td>
                                <td>
                                    {{ $booking->PaymentMethod->payment_method }}
                                </td>
                                <td>
                                    @php
                                        $corporate_amount = getCorporateCharges($booking);
                                    @endphp
                                    {{ $booking->CountryArea->Country->isoCode ." ". $booking->final_amount_paid }}

                                    @if(!empty($booking->corporate_id))
                                        <br><span class="badge badge-warning"> @lang("$string_file.corporate_charges") {{$corporate_amount}}</span>
                                    @endif

                                    @if(isset($booking->BookingDetail) && !empty($booking->BookingDetail->manual_corporate_fee))
                                        <br><span class="badge badge-primary"> @lang("$string_file.is_manual_corporate_fee_with_manual_charge")</span>
                                    @endif

                                    @if(isset($booking->BookingTransaction) && !empty($booking->BookingTransaction))
                                        <br>@lang("$string_file.driver_earning"): {{ $booking->CountryArea->Country->isoCode ." ". $booking->BookingTransaction->driver_earning }}
                                    @endif

                                </td>
                                <td>
                                    {!! convertTimeToUSERzone($booking->created_at, $booking->CountryArea->timezone,null,$booking->Merchant) !!}

                                </td>
                                <td>

                                    <a target="_blank" title="@lang("$string_file.requested_drivers")"
                                       href="{{ route('merchant.ride-requests',$booking->id) }}"
                                       class="btn btn-sm btn-success menu-icon btn_detail action_btn"><span
                                                class="fa fa-list-alt"></span></a>

                                    <a target="_blank" title="@lang("$string_file.ride_details")"
                                       href="{{ route('merchant.booking.details',$booking->id) }}"
                                       class="btn btn-sm btn-info menu-icon btn_money action_btn"><span
                                                class="fa fa-info-circle"
                                                title=""></span></a>

                                    <a target="_blank" title="@lang("$string_file.invoice")"
                                       href="{{ route('merchant.booking.invoice',$booking->id) }}"
                                       class="btn btn-sm btn-warning menu-icon btn_eye action_btn"><span
                                                class="fa fa-print"></span></a>

                                    <a href="javascript:void(0)"
                                       title="@lang("$string_file.reviews_and_symbol_rating")"
                                       data-toggle="modal" data-target="#ratingModal"
                                       data-user-rating="{{ $booking->BookingRating->user_rating_points ?? 0 }}"
                                       data-user-comment="{{ $booking->BookingRating->user_comment ?? '' }}"
                                       data-driver-rating="{{ $booking->BookingRating->driver_rating_points ?? 0 }}"
                                       data-driver-comment="{{ $booking->BookingRating->driver_comment ?? '' }}"
                                       class="btn btn-sm btn-primary menu-icon btn_eye action_btn show-rating">
                                        <span class="fa fa-star-o"></span>
                                    </a>
                                </td>
                            </tr>
                            @php $sr++  @endphp
                        @endforeach
                        </tbody>
                    </table>
                    @include('merchant.shared.table-footer', ['table_data' => $bookings, 'data' => $arr_search])
                </div>
            </div>
        </div>
    </div>


    <div class="modal fade" id="ratingModal" tabindex="-1" role="dialog" aria-labelledby="ratingModalLabel" aria-hidden="true">
        <div class="modal-dialog" role="document">
            <div class="modal-content">

                <div class="modal-header">
                    <h5 class="modal-title" id="ratingModalLabel">@lang("$string_file.reviews_and_symbol_rating")</h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>

                <div class="modal-body">
                    {{-- User Section --}}
                    <h6>User Rating:</h6>
                    <div id="user-stars"></div>
                    <p class="mt-2"><strong>Comment:</strong> <span id="user-comment">-</span></p>
                    <hr>

                    {{-- Driver Section --}}
                    <h6>Driver Rating:</h6>
                    <div id="driver-stars"></div>
                    <p class="mt-2"><strong>Comment:</strong> <span id="driver-comment">-</span></p>
                </div>

                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                </div>

            </div>
        </div>
    </div>




@endsection

@section('js')
    <script>
        function renderStars(rating) {
            let stars = '';
            for (let i = 1; i <= 5; i++) {
                stars += i <= rating
                    ? '<i class="fa fa-star text-warning"></i>'
                    : '<i class="fa fa-star-o text-muted"></i>';
            }
            return stars;
        }

        let selectedUserRating = 0, selectedDriverRating = 0;
        let selectedUserComment = '', selectedDriverComment = '';

        document.querySelectorAll('.show-rating').forEach(btn => {
            btn.addEventListener('click', function() {
                selectedUserRating = this.dataset.userRating;
                selectedDriverRating = this.dataset.driverRating;
                selectedUserComment = this.dataset.userComment || '-';
                selectedDriverComment = this.dataset.driverComment || '-';
            });
        });

        // Fill modal *after* it is fully visible → avoids aria-hidden focus issues
        $('#ratingModal').on('shown.bs.modal', function () {
            document.getElementById('user-stars').innerHTML = renderStars(selectedUserRating);
            document.getElementById('driver-stars').innerHTML = renderStars(selectedDriverRating);
            document.getElementById('user-comment').innerText = selectedUserComment;
            document.getElementById('driver-comment').innerText = selectedDriverComment;
        });
    </script>


@endsection
