@extends('merchant.layouts.main')
@section('content')
    <div class="page">
        <div class="page-content">
            @include('merchant.shared.errors-and-messages')
            <div class="panel panel-bordered">
                <header class="panel-heading">
                    <div class="panel-actions">
                    </div>
                </header>
                <div class="panel-body container-fluid">
                    {!! Form::open(['name'=>'','id'=>'','url'=>route('merchant.booking.order-assign-to-driver')]) !!}
                    {!! Form::hidden('booking_id',$booking->id) !!}
                    {!! Form::hidden('booking_status',$booking->booking_status) !!}

                    <h5>@lang("$string_file.booking_details") : - </h5>

                    <div class="row p-4 mb-2 bg-blue-grey-100 ml-15 mr-15">
                    <div class="col-md-3">
                        <strong>  @lang("$string_file.booking_details") </strong> : <br>
                       @lang("$string_file.booking_id") : #{{ $booking->merchant_booking_id }} <br>
                        
                    </div>
                    <div class="col-md-3">
                        <strong>@lang("$string_file.payment_details")</strong> : <br>
                        {{trans("$string_file.mode").": ". $booking->PaymentMethod->payment_method}}<br>
                        {{trans($string_file.".estimate_amount").': '.$booking->estimate_bill}} <br>
                    </div>
                    <div class="col-md-5">
                       <strong> @lang("$string_file.user_details") </strong> : {!! is_demo_data($booking->User->first_name,$booking->Merchant).' '.is_demo_data($booking->User->last_name,$booking->Merchant) !!}
                    </div>
                    </div>
                    <h5>@lang("$string_file.booking_drivers") : - </h5>
                    <table id="" class="display nowrap table table-hover table-stripedw-full" style="width:100%">
                        <thead>
                        <tr>
                            <th>@lang("$string_file.assign")</th>
                            <th>@lang("$string_file.name")</th>
                            <th>@lang("$string_file.estimate_distance")</th>
                            <th>@lang("$string_file.rating")</th>
                        </tr>
                        </thead>
                        <tbody>
                        @php $sr = 1; $drivers = count($arr_driver); @endphp
                        @if($drivers > 0)
                         @foreach($arr_driver as $driver)
                            <tr>
                                <td>
                                    <input type="checkbox" name="driver_id[]" value="{{$driver->id}}" class="assign-driver" driver-id="{{$driver->id}}" booking-id="{{$booking->id}}">
                                    {!! Form::hidden('distance['.$driver->id.']',$driver->distance) !!}
                                </td>
                                <td>
                                    {{ is_demo_data($driver->first_name,$booking->Merchant).' '.is_demo_data($driver->last_name,$booking->Merchant) }}<br>
                                    {{ is_demo_data($driver->email,$booking->Merchant)}}<br>
                                    {{ is_demo_data($driver->phoneNumber,$booking->Merchant)}}
                                </td>
                                <td>
                                    @if(!empty($driver->distance)){{ number_format($driver->distance,2)}} @else 0 @endif @lang("$string_file.km")
                                </td>
                                <td>
                                    @if($driver->rating) {{ $driver->rating}} @else @lang("$string_file.not_rated_yet") @endif
                                </td>
                            </tr>
                            @php $sr++  @endphp
                        @endforeach
                        @else
                            <tr>
                                <td colspan="6" class="text-center"> @lang("$string_file.no_driver_available")</td>
                            </tr>

                        @endif
                        </tbody>
                    </table>
                    @if( $drivers > 0)
                    <div class="form-actions d-flex flex-row-reverse p-2">
                        <button type="submit" class="btn btn-primary">
                            <i class="fa fa-check-circle"></i>@lang("$string_file.send")
                        </button>
                    </div>
                    @endif
                    {!! Form::close() !!}
                </div>
            </div>
        </div>
    </div>
@endsection
@section('js')
    <script>
</script>
@endsection