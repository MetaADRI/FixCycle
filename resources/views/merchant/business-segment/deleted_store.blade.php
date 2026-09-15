@extends('merchant.layouts.main')
@section('content')
    <div class="page">
        <div class="page-content">
            @include('merchant.shared.errors-and-messages')
            <div class="panel panel-bordered">
                <header class="panel-heading">
                    <div class="panel-actions">
                        
                    </div>
                    <h3 class="panel-title">
                        <i class="fa fa-building" aria-hidden="true"></i>
                        @lang("common.deleted") @lang("$string_file.business_segment")-{{ $slug }}
                    </h3>
                </header>
                <div class="panel-body">
                    
                    <table class="display nowrap table table-hover table-striped w-full" id="customDataTable"
                        style="width:100%" cellspacing="0">
                        <thead>
                            <tr>
                                <th>@lang("$string_file.sn")</th>
                                <th>@lang("$string_file.contact_details")</th>
                                <th>@lang("$string_file.address")</th>
                                <th>@lang("$string_file.rating")</th>
                                <th>@lang("$string_file.wallet_money")</th>
                                <th>@lang("$string_file.action")</th>
                            </tr>
                        </thead>
                        <tbody>
                            @php $sr = $bs->firstItem(); @endphp
                            @foreach($bs as $business_segment)
                                <tr>
                                    <td>{{ $sr }}</td>
                                    <td>
                                        @lang("$string_file.name"): {{ $business_segment->full_name }} <br>
                                        @lang("$string_file.phone"):
                                        {!! is_demo_data($business_segment->phone_number, $business_segment->Merchant) !!}
                                    </td>
                                    <td>
                                        @if(!empty($business_segment->address))
                                            <a title="{{$business_segment->address}}" target="_blank"
                                                href="https://www.google.com/maps/place/{{ $business_segment->address}}">
                                                @if($business_segment->business_logo)
                                                    <img src="{{get_image($business_segment->business_logo, 'business_logo', $business_segment->merchant_id)}}"
                                                        height="40" width="60">
                                                @else
                                                    <span class="btn btn-icon btn-success"><i class="icon wb-map"></i></span>
                                                @endif
                                            </a>
                                        @else
                                            ----
                                        @endif
                                    </td>
                                    <td>{{ $business_segment->rating }}</td>
                                    <td>{{$business_segment->wallet_amount}}</td>
                                    <td>
                                        <a href="#" onclick="restoreBusinessSegment('{{$business_segment->id}}')" data-toggle="tooltip" data-placement="top" title="@lang("$string_file.restore")  @lang("$string_file.business_segment") "
                                           class="btn btn-sm btn-success menu-icon btn_edit action_btn">
                                            <i class="fa fa-retweet"></i>
                                        </a>
                                        
                                    </td>
                                    
                                </tr>
                                @php $sr++  @endphp
                            @endforeach
                        </tbody>
                    </table>
                    @include('merchant.shared.table-footer', ['table_data' => $bs, 'data' => []])
                </div>
            </div>
        </div>
    </div>
    @include('merchant.shared.info-setting', ['info_setting' => [], 'page_name' => 'view_text'])

@endsection
@section('js')
    <script>
        function restoreBusinessSegment(business_segment_id) {
            var token = "{{csrf_token()}}";
            console.log(token)
            var url = "{{ route('merchant.business-segment.account.restore',$slug) }}";
            var indexUrl = "{{route('merchant.business-segment', $slug)}}";
            
            swal({
                title: '@lang("$string_file.are_you_sure")',
                text: '@lang("$string_file.restore") @lang("$string_file.business_segment")',
                icon: "warning",
                buttons: true,
                dangerMode: true,
            }).then((isConfirm) => {
                if (isConfirm) {
                    $.ajax({
                        headers: {
                            'X-CSRF-TOKEN': token
                        },
                        type: "POST",
                        url: url,
                        data: {
                            id: business_segment_id,
                            type: "RESTORE"
                        }
                    }).done(function (data) {
                        swal({
                            title: "Account Restored !",
                            text: data.message || "Business Segment has been Restored.",
                            icon: "success",
                        }).then(() => {
                           window.location.href = indexUrl;
                        });
                    });
                } else {
                    swal("@lang("$string_file.cancelled")");
                }
            });
        }
    </script>
@endsection