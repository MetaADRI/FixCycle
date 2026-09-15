@extends('merchant.layouts.main')
@section('content')
    <style>
        <link rel="stylesheet" href="https://cdn.datatables.net/rowgroup/1.4.1/css/rowGroup.dataTables.min.css">
    </style>
    <div class="page">
        <div class="page-content">
           @include("merchant.shared.errors-and-messages")
            <div class="panel panel-bordered">
                <header class="panel-heading">
                    
                    <h3 class="panel-title"><i class="wb-copy" aria-hidden="true"></i>
                        @lang("$string_file.membership_order_earning")
                    </h3>
                </header>
                <div class="panel-body container-fluid">
                    <table id="customDataTableCurrent" class="display nowrap table table-hover table-striped w-full" style="width:100%">
                        <thead>
                            <tr>
                                <th>@lang("$string_file.sn")</th>
                                <th>@lang("$string_file.merchant_earning")</th>
                                <th>@lang("$string_file.business_segment")</th>
                                <th>@lang("$string_file.order_id")</th>
                                <th>@lang("$string_file.user_detail")</th>
                                <th>@lang("$string_file.driver_detail")</th>
                                <th>@lang("$string_file.amount")</th>
                                <th>@lang("$string_file.created_at")</th>
                            </tr>
                        </thead>
                        <tbody>
                                @php $serial = 1; @endphp
                                @foreach($subscriptions as $start_date => $subscriptionGroup)
                                    @php 
                                        $rowspan = $subscriptionGroup->count();
                                        $first = $subscriptionGroup->first();
                                    @endphp
                                    @if(count($subscriptionGroup->skip(1)) > 0)
                                    <tr>
                                        <td rowspan="{{ $rowspan }}">{{ $serial }}</td>
                                        <td rowspan="{{ $rowspan }}">{{ $first->subscription_fee }}</td>
                                        <td rowspan="{{ $rowspan }}">{{ $first->BusinessSegment->full_name }}</td>
                                    </tr>
                                    @foreach($subscriptionGroup->skip(1) as $order)
                                        <tr>
                                            <td>{{ $order->order_id }}</td>
                                            <td>{{ $order->Order->User->first_name.' '.$order->Order->User->last_name}}</td>
                                            <td>{{ $order->Order->Driver->first_name.' '.$order->Order->Driver->last_name}}</td>
                                            <td>{{ $order->store_earning ?? '' }}</td>
                                            <td>{{ $order->Order->created_at }}</td>
                                        </tr>
                                    @endforeach
                                    @endif
                                    @php $serial++; @endphp
                                @endforeach
                            </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
    @include('merchant.shared.info-setting',['info_setting'=>[],'page_name'=>'view_text'])
@endsection
@section('js')
    <script src="https://cdn.datatables.net/rowgroup/1.4.1/js/dataTables.rowGroup.min.js"></script>
    $('#customDataTableCurrent').DataTable({
        responsive: true,
        scrollX: true,
        rowGroup: {
            dataSrc: 1 // adjust as needed
        }
    });
@endsection