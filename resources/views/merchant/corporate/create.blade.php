@extends('merchant.layouts.main')
@section('content')
    <div class="page">
        <div class="page-content">
            @include('merchant.shared.errors-and-messages')
            <div class="panel panel-bordered">
                <div class="panel-heading">
                    <div class="panel-actions">
                        <div class="btn-group float-right" style="margin:10px">
                            <a href="{{ route('corporate.index') }}">
                                <button type="button" class="btn btn-icon btn-success"><i class="wb-reply"></i>
                                </button>
                            </a>
                        </div>
                    </div>
                    <h3 class="panel-title"><i class="icon wb-plus" aria-hidden="true"></i>
                        @lang("$string_file.add_corporate")
                    </h3>
                </div>
                @php
                    $id = isset($corporate->id) ? $corporate->id : NULL;
                    $required = !empty($id) ? "" : "required"
                @endphp
                <div class="panel-body container-fluid">
                    <section id="validation">
                        <form method="POST" class="steps-validation wizard-notification" id="corporate-form" name="corporate-form"
                              enctype="multipart/form-data" action="{{ route('corporate.store',$id) }}">
                            @csrf
                            {!! Form::hidden('id',$id,array("id" => "corporate_id")) !!}
                            <div class="row">
                                <div class="col-md-4">
                                    <div class="form-group">
                                        <label for="firstName3">
                                            @lang("$string_file.name") :<span class="text-danger">*</span>
                                        </label>
                                        <input type="text" class="form-control" id="corporate_name"
                                               name="corporate_name"
                                               value="{{old('corporate_name',isset($corporate->corporate_name) ? $corporate->corporate_name : NULL)}}"
                                               placeholder="" required>
                                        @if ($errors->has('corporate_name'))
                                            <label class="text-danger">{{ $errors->first('corporate_name') }}</label>
                                        @endif
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="form-group">
                                        <label for="location3">@lang("$string_file.country")</label>
                                        <select class="form-control" name="country" id="country"
                                                required>
                                            <option value="">@lang("$string_file.select")</option>
                                            @foreach($countries  as $country)
                                                <option data-min="{{ $country->maxNumPhone }}"
                                                        data-max="{{ $country->maxNumPhone }}"
                                                        value="{{ $country->id }}" @if(!empty($corporate) && $corporate->country_id == $country->id) selected @endif>{{  $country->CountryName }}({{ $country->phonecode }})</option>
                                            @endforeach
                                        </select>
                                        @if ($errors->has('country'))
                                            <label class="text-danger">{{ $errors->first('country') }}</label>
                                        @endif
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="form-group">
                                        <label for="location3">@lang("$string_file.segment")</label>
                                        <select class="form-control" name="segment_id" id="segment">
                                            <option value="">@lang("$string_file.select")</option>
                                            @foreach($segments as $segment)
                                                <option value="{{$segment->id}}" @if(!empty($corporate) && $corporate->segment_id == $segment->id) selected @endif>{{$segment->name}}</option>
                                            @endforeach
                                        </select>
                                        @if ($errors->has('segment_id'))
                                            <label class="text-danger">{{ $errors->first('segment_id') }}</label>
                                        @endif
                                    </div>
                                </div>
                                <div class="col-md-4" style="display:none">
                                    <div class="form-group">
                                        <label for="location3">@lang("$string_file.price_type")<span class="text-danger">*</span></label>
                                        <select class="form-control" name="price_type" id="price_type" onChange="checkPriceType(this.value)" >
                                            <option value="">@lang("$string_file.select")</option>
                                            <option selected value="1" @if(!empty($corporate) && $corporate->price_type == 1) selected @endif>@lang("$string_file.price_card")</option>
                                            <option value="2" @if(!empty($corporate) && $corporate->price_type == 2) selected @endif>@lang("$string_file.fixed")</option>
                                            <option value="3" @if(!empty($corporate) && $corporate->price_type == 3) selected @endif>@lang("$string_file.discount")</option>
                                        </select>
                                        @if ($errors->has('price_type'))
                                            <label class="text-danger">{{ $errors->first('price_type') }}</label>
                                        @endif
                                    </div>
                                </div>
                                <div class="col-md-4 custom-hidden" id="price_card_amount_div">
                                    <div class="form-group">
                                        <label for="location3">@lang("$string_file.price") or @lang("$string_file.percentage")<span class="text-danger">*</span></label>
                                        <input type="text" class="form-control" name="price_card_amount" id="price_card_amount" @if(!empty($corporate)) value="{{$corporate->price_card_amount}}" @endif>
                                        @if ($errors->has('price_card_amount'))
                                            <label class="text-danger">{{ $errors->first('price_card_amount') }}</label>
                                        @endif
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="form-group">
                                        <label for="firstName3">
                                            @lang("$string_file.phone")<span class="text-danger">*</span>
                                        </label>
                                        {{--                                        {{p($corporate->Country->phonecode)}}--}}
                                        <input type="text" class="form-control" id="user_phone"
                                               name="phone" value="{{old('corporate_name',isset($corporate->corporate_phone) ? str_replace($corporate->Country->phonecode,"",$corporate->corporate_phone) : NULL)}}"
                                               placeholder="" required>
                                        @if ($errors->has('phone'))
                                            <label class="text-danger">{{ $errors->first('phone') }}</label>
                                        @endif
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="form-group">
                                        <label for="firstName3">
                                            @lang("$string_file.email")<span class="text-danger">*</span>
                                        </label>
                                        <input type="email" class="form-control" id="email"
                                               name="email" placeholder="" value="{{old('corporate_name',isset($corporate->email) ? $corporate->email : NULL)}}"
                                               required>
                                        @if ($errors->has('email'))
                                            <label class="text-danger">{{ $errors->first('email') }}</label>
                                        @endif
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="form-group">
                                        <label for="firstName3">
                                            @lang("$string_file.address")<span class="text-danger">*</span>
                                        </label>
                                        <input type="text" class="form-control" id="address"
                                               name="address"
                                               placeholder="" value="{{old('corporate_address',isset($corporate->corporate_address) ? $corporate->corporate_address : NULL)}}"
                                               required>
                                        @if ($errors->has('address'))
                                            <label class="text-danger">{{ $errors->first('address') }}</label>
                                        @endif
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="form-group">
                                        <label for="firstName3">
                                            @lang("$string_file.logo")
                                        </label>
                                        <input type="file" class="form-control" id="corporate_logo"
                                               name="corporate_logo">
                                        @if ($errors->has('corporate_logo'))
                                            <label class="text-danger">{{ $errors->first('corporate_logo') }}</label>
                                        @endif
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="form-group">
                                        <label for="firstName3">
                                            @lang("$string_file.cover") @lang("$string_file.image")
                                        </label>
                                        <input type="file" class="form-control" id="corporate_cover_image"
                                               name="corporate_cover_image">
                                        @if ($errors->has('corporate_cover_image'))
                                            <label class="text-danger">{{ $errors->first('corporate_cover_image') }}</label>
                                        @endif
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="form-group">
                                        <label for="firstName3">
                                            @lang("$string_file.password")<span class="text-danger">*</span>
                                        </label>
                                        <input type="password" class="form-control" id="password" autocomplete="new-password"
                                               name="password" placeholder=""
                                                {{$required}}>
                                        @if ($errors->has('password'))
                                            <label class="text-danger">{{ $errors->first('password') }}</label>
                                        @endif
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="form-group">
                                        <label for="driver_amount_credit_to_wallet"> @lang("$string_file.driver") @lang("$string_file.earning") @lang("$string_file.credit")  @lang("$string_file.to")  @lang("$string_file.wallet")</label>
                                        <select class="form-control" name="driver_amount_credit_to_wallet">
                                            <option value=""  >@lang("$string_file.select")</option>
                                            <option value="1" @if(isset($corporate->driver_amount_credit_to_wallet) && $corporate->driver_amount_credit_to_wallet == 1) selected @endif >@lang("$string_file.yes")</option>
                                            <option value="2" @if(isset($corporate->driver_amount_credit_to_wallet) && $corporate->driver_amount_credit_to_wallet == 2) selected @endif >@lang("$string_file.no")</option>
                                        </select>
                                        @if ($errors->has('corporate_fee'))
                                            <label class="text-danger">{{ $errors->first('driver_amount_credit_to_wallet') }}</label>
                                        @endif
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="form-group">
                                        <label for="firstName3">
                                            @lang("$string_file.confirm_password")<span class="text-danger">*</span>
                                        </label>
                                        <input type="password" class="form-control" id="password_confirmation"
                                               name="password_confirmation" placeholder=""
                                                {{$required}}>
                                        @if ($errors->has('password_confirmation'))
                                            <label class="text-danger">{{ $errors->first('password_confirmation') }}</label>
                                        @endif
                                    </div>
                                </div>

                                <div class="col-md-4">
                                    <div class="form-group">
                                        <label for="firstName3">
                                            @lang("$string_file.settlements")<span class="text-danger">*</span>
                                        </label>
                                        <select class="form-control" name="settlement_type" id="settlement_type" required>
                                            <option value="">@lang("$string_file.select")</option>
                                            <option value="1" @if(isset($corporate) && $corporate->settlement_type ==1) selected @endif >@lang("$string_file.weekly")</option>
                                            <option value="2" @if(isset($corporate) && $corporate->settlement_type ==2) selected @endif >@lang("$string_file.bi_weekly")</option>
                                            <option value="3" @if(isset($corporate) && $corporate->settlement_type ==3) selected @endif >@lang("$string_file.monthly")</option>
                                            <option value="4" @if(isset($corporate) && $corporate->settlement_type ==4) selected @endif >@lang("$string_file.custom") @lang("$string_file.days")</option>
                                        </select>
                                        @if ($errors->has('settlement_type'))
                                            <label class="text-danger">{{ $errors->first('settlement_type') }}</label>
                                        @endif
                                    </div>
                                </div>

                                <div class="col-md-4">
                                    <div class="form-group">
                                        <label for="firstName3">
                                            @lang("$string_file.billing_credit_limit")<span class="text-danger">*</span>
                                        </label>
                                        <input type="number" class="form-control" id="billing_credit_limit"
                                               name="billing_credit_limit" placeholder="" @if(isset($corporate) && $corporate->billing_credit_limit) value="{{$corporate->billing_credit_limit}}" @endif
                                               required>
                                        @if ($errors->has('billing_credit_limit'))
                                            <label class="text-danger">{{ $errors->first('billing_credit_limit') }}</label>
                                        @endif
                                    </div>
                                </div>

                                <div class="col-md-4">
                                    <div class="form-group">
                                        <div id="custom_days_wrapper" style="display: none; margin-top: 10px;">
                                            <label for="custom_days">@lang("$string_file.days")</label>
                                            <input
                                                    type="number"
                                                    name="custom_days"
                                                    id="custom_days"
                                                    class="form-control"
                                                    min="1"
                                                    max="30"
                                                    value="{{old('custom_days',(isset($corporate) && ($corporate->settlement_type == 4)) ? $corporate->settlement_custom_days : NULL)}}"
                                                    placeholder="@lang("$string_file.enter_days_between_1_and_30")">
                                        </div>
                                    </div>
                                </div>


                                <div class="col-md-4">
                                    <div class="form-group">
                                        <label for="corporate_fee_method"> @lang("$string_file.corporate_fee_method") </label>
                                        <select name="corporate_fee_method" id="corporate_fee_method" class="form-control">
                                            <option @if(isset($corporate) && ($corporate->corporate_fee_method == 1)) Selected @endif value="1">@lang("$string_file.flat")</option>
                                            <option @if(isset($corporate) && ($corporate->corporate_fee_method == 2)) Selected @endif value="2">@lang("$string_file.percentage")</option>
                                        </select>
                                        @if ($errors->has('corporate_fee_method'))
                                            <label class="text-danger">{{ $errors->first('corporate_fee_method') }}</label>
                                        @endif
                                    </div>
                                </div>

                                <div class="col-md-4">
                                    <div class="form-group">
                                        <label for="corporate_fee"> @lang("$string_file.corporate_fee") </label>
                                        <input type="number" class="form-control" id="corporate_fee"
                                               name="corporate_fee" placeholder="" @if(isset($corporate) && $corporate->corporate_fee) value="{{$corporate->corporate_fee}}" @endif
                                               required>
                                        @if ($errors->has('corporate_fee'))
                                            <label class="text-danger">{{ $errors->first('corporate_fee') }}</label>
                                        @endif
                                    </div>
                                </div>

                                @if(isset($merchant->BookingConfiguration->corporate_insurance_charge) && $merchant->BookingConfiguration->corporate_insurance_charge == 1)
                                    <div class="col-md-4">
                                        <div class="form-group">
                                            <label for="corporate_fee"> @lang("$string_file.corporate_insurance_charge") </label>
                                            <input type="number" class="form-control" id="corporate_insurance_charge"
                                                   name="corporate_insurance_charge" placeholder="" @if(isset($corporate) && $corporate->corporate_insurance_charge) value="{{$corporate->corporate_insurance_charge}}" @endif
                                                    >
                                            @if ($errors->has('corporate_insurance_charge'))
                                                <label class="text-danger">{{ $errors->first('corporate_insurance_charge') }}</label>
                                            @endif
                                        </div>
                                    </div>
                                @endif
                            </div>

                            <div class="row">

                            </div>
                            <div class="form-actions right" style="margin-bottom: 3%">
                                <button type="submit" class="btn btn-primary float-right">
                                    <i class="wb-check-circle"></i> @lang("$string_file.save")
                                </button>
                            </div>
                        </form>
                    </section>
                </div>
            </div>
        </div>
    </div>
@endsection
@section('js')
    <script>
        function checkPriceType(val){
            console.log('val: '+val);
            if(val == "" || val == 1){
                $('#price_card_amount_div').hide();
            }else{
                $('#price_card_amount_div').show();
            }
        }

        $(document).ready(function(){
            var pricetype = $('#price_type').val();
            checkPriceType(pricetype);
        });


    document.addEventListener('DOMContentLoaded', function () {
        const settlementSelect = document.getElementById('settlement_type');
        const customDaysWrapper = document.getElementById('custom_days_wrapper');

        function toggleCustomInput() {
            if (settlementSelect.value === '4') {
                customDaysWrapper.style.display = 'block';
            } else {
                customDaysWrapper.style.display = 'none';
            }
        }

        // Initial check (for editing existing forms)
        toggleCustomInput();

        // Listen for changes
        settlementSelect.addEventListener('change', toggleCustomInput);
    });
    </script>
@endsection
