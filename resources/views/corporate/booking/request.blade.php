@extends('corporate.layouts.main')
@section('content')
    <div class="page">
        <div class="page-content">
            <div class="panel panel-bordered">
                <div class="card-header py-3">
                    <div class="content-header row">
                        <div class="content-header-left col-md-8 col-12 mb-2 breadcrumb-new">
                            <h3 class="content-header-title mb-0 d-inline-block">@lang("$string_file.driver_request")</h3>
                        </div>
                        <div class="content-header-right col-md-4 col-12">
                            <div class="btn-group float-md-right">
                                <a href="{{ URL::previous() }}">
                                    <button type="button" class="btn btn-icon btn-success mr-1"><i class="fa fa-reply"></i>
                                    </button>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="panel-body container-fluid">
                    {{--                                            <b>OneSignal Summary =></b> Total request <b></b> Total request success<b></b> Total request failed<b></b> --}}
                    <table id="customDataTable" class="display nowrap table table-hover table-stripedw-full"
                        style="width:100%">
                        <thead>
                            <tr>
                                <th>@lang("$string_file.sn")</th>
                                <th>@lang("$string_file.driver")</th>
                                <th>@lang("$string_file.distance_from_pickup")</th>
                                <th>@lang("$string_file.current_status_check")</th>
                                <th>@lang("$string_file.created_at")</th>
                                <th>@lang("$string_file.last_update")</th>
                            </tr>
                        </thead>
                        <tbody>
                            @php $sn =1; @endphp
                            @foreach ($booking->BookingRequestDriver as $driver)
                                @php
                                $tz = isset($driver->Driver) ? $driver->Driver->CountryArea->timezone : "UTC";
                            @endphp
                            <tr>
                                <td>{!! $sn !!}</td>
                                <td>
                                    @if (Auth::user()->demo == 1)
                                        {{ '********' . substr($driver->Driver->first_name . $driver->Driver->last_name, -2) }}

                                    @else
                                        {{ $driver->Driver->first_name . $driver->Driver->last_name }}

                                    @endif
                                </td>
                                <td>
                                    {{ round($driver->distance_from_pickup, 2) }}
                                </td>
                                <td>
                                    @switch($driver->request_status)
                                        @case(1)
                                            @lang("$string_file.no_action")
                                            @break

                                            @case(2)
                                                @lang("$string_file.accepted")
                                            @break

                                            @case(3)
                                                @lang("$string_file.rejected")
                                            @break
                                        @endswitch
                                    </td>
                                    <td>
                                        {!! convertTimeToUSERzone($driver->created_at, $tz, null, $driver->Merchant) !!}

                                    </td>
                                    <td>
                                        {!! convertTimeToUSERzone($driver->updated_at, $tz, null, $driver->Merchant) !!}

                                    </td>
                                </tr>
                                @php $sn++; @endphp
                            @endforeach
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
@endsection
