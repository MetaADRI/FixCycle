@extends('corporate.layouts.main')
@section('content')
    <div class="page">
        <div class="page-content">
            <div class="panel panel-bordered">
                <header class="panel-heading">
                    <div class="panel-actions">
                        @if(Auth::user()->demo == 1)
                            {{--                                <a href="">--}}
                            {{--                                    <button type="button" class="btn btn-icon btn-primary mr-1 float-right" style="margin:10px" data-original-title="@lang("$string_file.export_excel")" data-toggle="tooltip"><i--}}
                            {{--                                                class="fa fa-download"></i>--}}
                            {{--                                    </button>--}}
                            {{--                                </a>--}}
                        @else
                            {{--<a href="{{route('transaction.wallet-report.export',$data)}}">--}}
                                {{--<button type="button" class="btn btn-icon btn-primary mr-1 float-right" style="margin:10px" data-original-title="@lang("$string_file.export_excel")" data-toggle="tooltip"><i--}}
                                            {{--class="fa fa-download"></i>--}}
                                {{--</button>--}}
                            {{--</a>--}}
                        @endif
                    </div>
                    <h3 class="panel-title">
                        <i class=" wb-flag" aria-hidden="true"></i>
                        {{$page_title}}
                    </h3>
                </header>
                <div class="panel-body container-fluid">
                    <table id="customDataTable" class="display nowrap table table-hover table-striped w-full" style="width:100%">
                        <thead>
                        <tr>
                            <th>@lang("$string_file.sn")</th>
                            {{--                                <th>@lang("$string_file.id")</th>--}}
                            <th>@lang("$string_file.receiver_details")</th>
                            <th>@lang("$string_file.amount")</th>
                            <th>@lang("$string_file.transaction_for")</th>
                            <th>@lang("$string_file.transaction_type")</th>
                            <th>@lang("$string_file.date")</th>
                            <th>@lang("$string_file.transaction_from")</th>
                            <th>@lang("$string_file.narration")</th>
                            <th>@lang("$string_file.transaction_by")</th>
                        </tr>
                        </thead>
                        <tbody>
                        @php $sr = $wallet_transactions->firstItem() @endphp
                        @foreach($wallet_transactions as $transaction)
                            <tr>
                                <td>{{ $sr  }}</td>
                                {{--                                    <td>{{ $transaction->id  }}</td>--}}
                                @if(Auth::user()->demo == 1)
                                    <td>
                                        {{ "********".substr($transaction->user_name, -2) }}
                                        <br>
                                        {{"********".substr( $transaction->user_phone, -2) }}
                                        <br>
                                        {{ "********".substr($transaction->user_email, -2) }}
                                    </td>
                                @else
                                    <td>
                                        {{ $transaction->user_name }}
                                        <br>
                                        {{ $transaction->user_phone }}
                                        <br>
                                        {{ $transaction->user_email }}
                                    </td>
                                @endif
                                <td>{{ $transaction->amount  }}</td>
                                <td>
                                    @if(isset($transaction->booking_id) && !empty($transaction->booking_id))
                                        @lang("$string_file.ride_id") : <a target="_blank" title="@lang("$string_file.ride_details")" href="{{ route('merchant.booking.details',$transaction->booking_id) }}">{{$transaction->booking_id}}</a>
                                    @elseif(isset($transaction->order_id) && !empty($transaction->order_id))
                                        @lang("$string_file.order_id") : <a target="_blank" title="@lang("$string_file.order_details")" href="{{ route('driver.order.detail',$transaction->order_id) }}">{{$transaction->order_id}}</a>
                                    @elseif(isset($transaction->handyman_order_id) && !empty($transaction->handyman_order_id))
                                        @lang("$string_file.booking_id") : <a target="_blank" title="@lang("$string_file.booking_details")" href="{{ route('merchant.handyman.order.detail',$transaction->handyman_order_id) }}">{{$transaction->handyman_order_id}}</a>
                                    @else
                                        ---
                                    @endif
                                </td>
                                <td>{{ $transaction->transaction_type }}</td>
                                <td>{{ convertTimeToUSERzone($transaction->created_at, null,null,$transaction->Merchant) }}
                                <td>{{ $transaction->platform }}
                                <td>{{ $transaction->narration }}
                                <td>{{ $transaction->action_merchant_name }}
                            </tr>
                            @php $sr++  @endphp
                        @endforeach
                        </tbody>
                    </table>
                    <div class="pagination1 float-right">{{ $wallet_transactions->links() }}</div>
                </div>
            </div>
        </div>
    </div>
@endsection