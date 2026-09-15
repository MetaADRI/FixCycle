@extends('merchant.layouts.main')
@section('content')
    <div class="page">
        <div class="page-content">
            @include('merchant.shared.errors-and-messages')
            <div class="panel panel-bordered">
                <header class="panel-heading">
                    <div class="panel-actions">
                        {{--@if($export_permission)
                            <a href="{{route('excel.complete',$arr_search)}}" data-toggle="tooltip">
                                <button type="button" class="btn btn-icon btn-primary float-right"
                                        style="margin: 10px;">
                                    <i class="wb-download" title="@lang("$string_file.export_excel")"></i>
                                </button>
                            </a>
                        @endif--}}
                    </div>
                    <h3 class="panel-title"><i class="fa-taxi" aria-hidden="true"></i>
                        @lang("$string_file.payment_outstanding")
                    </h3>
                </header>
                <div class="panel-body container-fluid">
                    <table id="customDataTable" class="display nowrap table table-hover table-striped w-full"
                           style="width:100%">
                        <thead>
                        <tr>
                            <th>@lang("$string_file.sn")</th>
                            <th>@lang("$string_file.user_details")</th>
                            <th>@lang("$string_file.amount")</th>
                            <th>@lang("$string_file.reason")</th>
                            <th>@lang("$string_file.pay_status")</th>
                            <th>@lang("$string_file.date")</th>
                        </tr>
                        </thead>
                        <tbody>
                        @php 
                            $sr = $outstandings->firstItem();
                        @endphp
                        @foreach($outstandings as $outstanding)
                                @if($outstanding->Booking)
                                    $timezone = $outstanding->Booking->CountryArea->timezone;
                                @elseif($outstanding->Order)
                                    $timezone = $outstanding->Order->CountryArea->timezone;
                                @else
                                    $timezone = 'Asia/Kolkata';
                                @endif
                            <tr>
                                <td>{{ $sr }}</td>
                                <td>
                                    {{ $outstanding->User->first_name .' '. $outstanding->User->last_name }}<br>
                                    {{ $outstanding->User->UserPhone}}
                                </td>
                                <td>{{ $outstanding->amount }}</td>
                                <td>{{ $outstanding->reason }}</td>
                                <td>{{ $outstanding->pay_status == 0 ? 'UnPaid' : 'Paid' }}</td>
                                <td>{!! convertTimeToUSERzone($outstanding->created_at, $timezone,null,$merchant) !!}</td>
                            </tr>
                        @php $sr++  @endphp
                        @endforeach
                        </tbody>
                    </table>
                    @include('merchant.shared.table-footer', ['table_data' => $outstandings, 'data' => []])
                </div>
            </div>
        </div>
    </div>
@endsection