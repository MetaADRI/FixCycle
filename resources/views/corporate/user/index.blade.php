@extends('corporate.layouts.main')
@section('content')
    @csrf
    <div class="page">
        <div class="page-content">
            {{--            @if(session('success'))--}}
            {{--                <div class="alert dark alert-icon alert-success" role="alert">--}}
            {{--                    <button type="button" class="close" data-dismiss="alert" aria-label="Close">--}}
            {{--                        <span aria-hidden="true">Ã—</span>--}}
            {{--                    </button>--}}
            {{--                    <i class="icon wb-info" aria-hidden="true"></i> {{ session('success') }}--}}
            {{--                </div>--}}
            {{--            @endif--}}
            {{--            @if(session('error'))--}}
            {{--                <div class="alert dark alert-icon alert-danger" role="alert">--}}
            {{--                    <button type="button" class="close" data-dismiss="alert" aria-label="Close">--}}
            {{--                        <span aria-hidden="true">Ã—</span>--}}
            {{--                    </button>--}}
            {{--                    <i class="icon wb-close" aria-hidden="true"></i> {{ session('error') }}--}}
            {{--                </div>--}}
            {{--            @endif--}}
            @include("merchant.shared.errors-and-messages")
            <div class="panel panel-bordered">
                <header class="panel-heading">
                    <div class="panel-actions">
                        {{--                        <a href="{{route('corporate.user.create')}}">--}}
                        {{--                            <button type="button" class="btn btn-icon btn-success float-right" style="margin:10px">--}}
                        {{--                                <i class="wb-plus" title="@lang("$string_file.add_user")"></i>--}}
                        {{--                            </button>--}}
                        {{--                        </a>--}}
                        <a href="#">
                            <button type="button" class="btn btn-icon btn-warning float-right" style="margin:10px"
                                    data-toggle="modal" data-target="#importModal">
                                <i class="fa fa-cloud-download"
                                   title="@lang("$string_file.import") @lang("$string_file.from")  {{$merchant->BusinessName}}"></i>
                            </button>
                        </a>
                        <a href="{{route('corporate.excel.user')}}" data-toggle="tooltip">
                            <button type="button" class="btn btn-icon btn-primary float-right" style="margin:10px">
                                <i class="wb-download" title="@lang("$string_file.export_excel")"></i>
                            </button>
                        </a>
                        {{--                        <a href="{{ route('corporate.user.import.fail') }}">--}}
                        {{--                            <button type="button" class="btn btn-icon btn-danger float-right" style="margin:10px">--}}
                        {{--                                @lang("$string_file.fail_import")--}}
                        {{--                                <span class="badge badge-pill">{{$failImport}}</span>--}}
                        {{--                            </button>--}}
                        {{--                        </a>--}}
                    </div>
                    <h3 class="panel-title"><i class="fa fa-users" aria-hidden="true"></i>
                        @lang("$string_file.user_management")</h3>
                </header>
                <div class="panel-body container-fluid">
                    {{--                    <form action="{{route('corporate.user.import')}}" enctype="multipart/form-data" method="post">--}}
                    {{--                        @csrf--}}
                    {{--                        <div class="table_search row p-3">--}}
                    {{--                            <div class="col-md-4 col-xs-6 active-margin-top">--}}
                    {{--                                <input type="file" class="form-control" name="import_data"/>--}}
                    {{--                            </div>--}}
                    {{--                            <div class="col-md-2 col-xs-6 form-group active-margin-top">--}}
                    {{--                                <button class="btn btn-success" type="submit" value="Import"><i--}}
                    {{--                                            class="icon wb-upload"--}}
                    {{--                                            aria-hidden="true"></i>--}}
                    {{--                                </button>--}}
                    {{--                            </div>--}}
                    {{--                        </div>--}}
                    {{--                    </form>--}}
                    <form action="{{ route('corporate.user.search') }}" method="post">
                        @csrf
                        <div class="table_search row p-3 ">
                            <div class="col-md-2 col-xs-6 active-margin-top">@lang("$string_file.search_by") :</div>
                            <div class="col-md-2 col-xs-12 form-group active-margin-top">
                                <select class="form-control" name="parameter" id="parameter" required>
                                    <option value="1">@lang("$string_file.name")</option>
                                    <option value="2">@lang("$string_file.email")</option>
                                    <option value="3">@lang("$string_file.phone")</option>
                                </select>
                            </div>

                            <div class="col-md-2 col-xs-12 form-group active-margin-top">
                                <input type="text" id="keyword" name="keyword"
                                       placeholder="@lang("$string_file.enter_text")" class="form-control" type="text">
                            </div>
                            <div class="col-sm-2 col-xs-12 form-group active-margin-top">
                                <button class="btn btn-primary" type="submit" name="seabt12"><i class="fa fa-search"
                                                                                                aria-hidden="true"></i>
                                </button>
                            </div>
                        </div>
                    </form>
                    <table id="customDataTable" class="display nowrap table table-hover table-striped w-full"
                           style="width:100%">
                        <thead>
                        <tr>
                            <th>@lang("$string_file.sn")</th>
                            <th>@lang("$string_file.profile_image")</th>
                            <th>@lang("$string_file.user_details")</th>
                            <th>@lang("$string_file.designation")</th>
                            @if($config->gender == 1)
                                <th>@lang("$string_file.gender")</th>
                            @endif
                            <th>@lang("$string_file.service_statistics")</th>
                            <!--<th>@lang("$string_file.signup_details")</th>-->
                            <!--<th>@lang("$string_file.registered_date")</th>-->
                            <th>@lang("$string_file.status")</th>
                            <th>@lang("$string_file.action")</th>
                        </tr>
                        </thead>
                        <tbody>
                        @php $sr = $users->firstItem() @endphp
                        @foreach($users as $user)
                            <tr>
                                <td>{{ $sr }}  </td>
                                <td><img class="rounded-circle" height="60px" width="60px"
                                         src="{{get_image($user->UserProfileImage,'user',$merchant->id)}}">
                                </td>
                                @if(Auth::user()->demo == 1)
                                    <td>
                                        <span class="long_text">   {!! nl2br("********".substr($user->last_name, -2)."\n"."********".substr($user->UserPhone, -2)."\n"."********".substr($user->email, -2)) !!}</span>
                                        @if(isset($user->UserDetail) && $user->UserDetail->is_default_corporate_user == 1)
                                            <br><span class="badge bg-primary">@lang("$string_file.default") @lang("$string_file.user")</span>
                                        @endif
                                    </td>
                                @else
                                    <td>
                                        <span class="long_text">   {!! nl2br($user->first_name." ".$user->last_name."\n".$user->UserPhone."\n".$user->email) !!}</span>
                                        @if(isset($user->UserDetail) && $user->UserDetail->is_default_corporate_user == 1)
                                            <br><span class="badge bg-primary">@lang("$string_file.default") @lang("$string_file.user")</span>
                                        @endif
                                    </td>
                                @endif
                                <td>
                                    {{ $user->employeeDesignation ? $user->employeeDesignation->Department->name :  '' }}
                                    <br>{{ $user->employeeDesignation->designation_name ?? 'N/A' }}

                                    @if(!empty($user->employeeDesignation))
                                        <br>
                                        {{$user->employeeDesignation->designation_expense_limit}} / {{ $user->getUserCorporateExpenseLimit($user->employeeDesignation, $user->corporate_id)  }}
                                    @endif

                                </td>
                                @if($config->gender == 1)
                                    @switch($user->user_gender)
                                        @case(1)
                                            <td>@lang("$string_file.male")</td>
                                            @break
                                        @case(2)
                                            <td>@lang("$string_file.female")</td>
                                            @break
                                        @default
                                            <td>------</td>
                                    @endswitch
                                @endif
                                <td>
                                    @if($user->user_total_trip)
                                        {{ $user->user_total_trip }}  @lang("$string_file.rides")
                                    @else
                                        @lang("$string_file.no_ride")
                                    @endif
                                    <br>
                                    @if ($user->rating == "0.0")
                                        @lang("$string_file.not_rated_yet")
                                    @else
                                        @while($user->rating>0)
                                            @if($user->rating >0.5)
                                                <img src="{{ view_config_image("static-images/star.png") }}"
                                                     alt='Whole Star'>
                                            @else
                                                <img src="{{ view_config_image('static-images/halfstar.png') }}"
                                                     alt='Half Star'>
                                            @endif
                                            @php $user->rating--; @endphp
                                        @endwhile
                                    @endif
                                </td>

                                {{-- <td>
                                    @if($user->user_type == 1)
                                        @lang("$string_file.corporate_user")
                                    @else
                                        @lang("$string_file.retail")
                                    @endif
                                    <br>
                                    @switch($user->UserSignupType)
                                        @case(1)
                                            @lang("$string_file.normal")
                                            @break
                                        @case(2)
                                            @lang("$string_file.google")
                                            @break
                                        @case(3)
                                            @lang("$string_file.facebook")
                                            @break
                                    @endswitch
                                    <br>
                                    @switch($user->UserSignupFrom)
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
                                <td>{{ $user->created_at->toformatteddatestring() }}</td> --}}
                                <td>
                                    @if($user->UserStatus == 1)
                                        <span class="badge badge-success">@lang("$string_file.active")</span>
                                    @else
                                        <span class="badge badge-danger">@lang("$string_file.inactive")</span>
                                    @endif
                                </td>
                                <td>
                                    {{--                                    <div>--}}
                                    {{--                                        @if(Auth::user('merchant')->can('create_promotion'))--}}
                                    {{--                                            <span data-target="#sendNotificationModelUser"--}}
                                    {{--                                                  data-toggle="modal" id="{{ $user->id }}"><a--}}
                                    {{--                                                        data-original-title="@lang("$string_file.send_notification")"--}}
                                    {{--                                                        data-toggle="tooltip"--}}
                                    {{--                                                        id="{{ $user->id }}"--}}
                                    {{--                                                        data-placement="top"--}}
                                    {{--                                                        class="btn text-white btn-sm btn-warning menu-icon btn_detail action_btn"> <i--}}
                                    {{--                                                            class="fa fa-bell"></i> </a></span>--}}
                                    {{--                                        @endif--}}
                                    {{--                                        <a href="{{ route('corporate.user.edit',$user->id) }}"--}}
                                    {{--                                           data-original-title="@lang("$string_file.edit")" data-toggle="tooltip"--}}
                                    {{--                                           data-placement="top"--}}
                                    {{--                                           class="btn btn-sm btn-primary menu-icon btn_edit action_btn">--}}
                                    {{--                                            <i class="fa fa-edit"></i> </a>--}}

                                    {{--                                        <a href="{{ route('corporate.user.show',$user->id) }}"--}}
                                    {{--                                           class="btn btn-sm btn-info menu-icon btn_delete action_btn"--}}
                                    {{--                                           data-original-title="@lang("$string_file.details")"--}}
                                    {{--                                           data-toggle="tooltip"--}}
                                    {{--                                           data-placement="top"><span--}}
                                    {{--                                                    class="fa fa-user"></span></a>--}}
                                    {{--                                        <a href="{{ route('corporate.user.favourite',$user->id) }}"--}}
                                    {{--                                           class="btn btn-sm btn-info menu-icon btn_location action_btn"--}}
                                    {{--                                           data-original-title="Favourite Locations"--}}
                                    {{--                                           data-toggle="tooltip"--}}
                                    {{--                                           data-placement="top"><span--}}
                                    {{--                                                    class="fa fa-location-arrow"></span></a>--}}
                                    {{--                                        @if(isset($merchant) && $merchant->ApplicationConfiguration->favourite_driver_module == 1)--}}
                                    {{--                                            <a href="{{ route('corporate.user.favourite.driver',$user->id) }}"--}}
                                    {{--                                               class="btn btn-sm btn-warning menu-icon btn_detail action_btn"--}}
                                    {{--                                               data-original-title="Favourite Drivers"--}}
                                    {{--                                               data-toggle="tooltip"--}}
                                    {{--                                               data-placement="top"><span--}}
                                    {{--                                                        class="fa fa-id-card"></span></a>--}}
                                    {{--                                        @endif--}}

                                    {{--                                        @if($user->UserStatus == 1)--}}
                                    {{--                                            <a href="{{ route('corporate.user.change.status',['id'=>$user->id,'status'=>2]) }}"--}}
                                    {{--                                               data-original-title="@lang("$string_file.inactive")"--}}
                                    {{--                                               data-toggle="tooltip"--}}
                                    {{--                                               data-placement="top"--}}
                                    {{--                                               class="btn btn-sm btn-danger menu-icon btn_eye_dis action_btn">--}}
                                    {{--                                                <i class="fa fa-eye-slash"></i> </a>--}}
                                    {{--                                        @else--}}
                                    {{--                                            <a href="{{ route('corporate.user.change.status',['id'=>$user->id,'status'=>1]) }}"--}}
                                    {{--                                               data-original-title="@lang("$string_file.active")"--}}
                                    {{--                                               data-toggle="tooltip"--}}
                                    {{--                                               data-placement="top"--}}
                                    {{--                                               class="btn btn-sm btn-success menu-icon btn_eye action_btn">--}}
                                    {{--                                                <i class="fa fa-eye"></i> </a>--}}
                                    {{--                                        @endif--}}

                                    {{--                                        @if(Auth::user()->demo != 1)--}}
                                    {{--                                            <button onclick="DeleteEvent({{ $user->id }})"--}}
                                    {{--                                                    type="submit"--}}
                                    {{--                                                    data-original-title="@lang("$string_file.delete")"--}}
                                    {{--                                                    data-toggle="tooltip"--}}
                                    {{--                                                    data-placement="top"--}}
                                    {{--                                                    class="btn btn-sm btn-danger menu-icon btn_delete action_btn">--}}
                                    {{--                                                <i class="fa fa-trash"></i></button>--}}
                                    {{--                                        @endif--}}
                                    {{--                                    </div>--}}

                                    {{--                                                <span data-target="#approvalModalCenter" onclick="handleApprovalModal('{{$user->id}}')"--}}
                                    {{--                                                  data-toggle="modal" id="{{ $user->id }}"><a--}}
                                    {{--                                                        data-original-title="@lang("$string_file.approve")"--}}
                                    {{--                                                        data-toggle="tooltip"--}}
                                    {{--                                                        id="{{ $user->id }}"--}}
                                    {{--                                                        data-placement="top"--}}
                                    {{--                                                        class="btn text-white btn-sm btn-warning menu-icon btn_detail action_btn"> <i--}}
                                    {{--                                                            class="fa fa-files-o"></i> </a></span>--}}

                                    @if(isset($user->UserDetail) && $user->UserDetail->is_default_corporate_user != 1)
                                        <button class="btn btn-danger" onclick="handleRemoveModal('{{ $user->id }}', '{{ $user->first_name.' '.$user->last_name }}') ">
                                             <span>
                                                <i class="fa fa-minus-circle" aria-hidden="true"></i>
                                            </span>
                                        </button>
                                    @endif
                                    @if(isset($user->UserDetail) && $user->UserDetail->is_default_corporate_user != 1)
                                        @php
                                            $need_approver = isset($user->UserDetail) ? $user->UserDetail->need_approval_for_corporate : 2;
                                            $approver_ids = isset($user->DesignationApprover) ? $user->DesignationApprover->where("user_id", $user->id)->pluck("approver_id")->toArray() : [];
                                        @endphp

                                        <button class="btn btn-warning "
                                                data-user-id="{{ $user->id }}"
                                                data-need-for-approval="{{$need_approver}}"
                                                data-approver-ids="{{json_encode($approver_ids)}}"
                                                data-toggle="modal" data-target="#updateApproverModal"
                                        >
                                             <span>
                                                <i class="fa fa-pencil-square" aria-hidden="true"></i>
                                            </span>
                                        </button>
                                    @endif

                                </td>
                            </tr>
                            @php $sr++  @endphp
                        @endforeach
                        </tbody>
                    </table>
                    <div class="pagination1 float-right">{{ $users->links() }}</div>
                </div>
            </div>
        </div>
    </div>

    <div class="modal fade" id="approvalModalCenter" tabindex="-1" role="dialog" aria-labelledby="approvalModalCenterTitle" aria-hidden="true">
        <div class="modal-dialog modal-dialog" role="document">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="approvalModalLongTitle">Modal title</h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div class="modal-body">
                    <table class="table table-bordered" id="approvalTable">
                        <thead>
                        <tr>
                            <th>#</th>
                            <th>User</th>
                            <th>Phone</th>
                            <th>Pickup</th>
                            <th>Drop</th>
                            <th>Scheduled At</th>
                            <th>Action</th>
                        </tr>
                        </thead>
                        <tbody>
                        <!-- Filled dynamically -->
                        </tbody>
                    </table>
                </div>
                <div class="modal-footer">
                    <!--<button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>-->
                    <!--<button type="button" class="btn btn-primary">Save changes</button>-->
                </div>
            </div>
        </div>
    </div>

    <div class="modal fade text-left" id="sendNotificationModelUser" tabindex="-1" role="dialog"
         aria-labelledby="myModalLabel33"
         aria-hidden="true">
        <div class="modal-dialog" role="document">
            <div class="modal-content">
                <div class="modal-header">
                    <label class="modal-title text-text-bold-600"
                           id="myModalLabel33">@lang("$string_file.send_notification") </label>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <form action="{{ route('merchant.sendsingle-user') }}" enctype="multipart/form-data" method="post">
                    @csrf
                    <div class="modal-body">
                        <label>@lang("$string_file.title") </label>
                        <div class="form-group">
                            <input type="text" class="form-control" id="title"
                                   name="title"
                                   placeholder="" required>
                        </div>

                        <label>@lang("$string_file.message") </label>
                        <div class="form-group">
                           <textarea class="form-control" id="message" name="message"
                                     rows="3"
                                     placeholder="" required></textarea>
                        </div>

                        <label>@lang("$string_file.image") </label>
                        <div class="form-group">
                            <input type="file" class="form-control" id="image"
                                   name="image"
                                   placeholder="@lang("$string_file.image")">
                            <input type="hidden" name="persion_id" id="persion_id" required>
                        </div>
                        <label>@lang("$string_file.show_in_promotion") </label>
                        <div class="form-group">
                            <input type="checkbox" value="1" name="expery_check"
                                   id="expery_check_two">
                        </div>

                        <label>@lang("$string_file.expire_date") </label>
                        <div class="form-group">
                            <input type="text" class="form-control datepicker"
                                   id="datepicker-backend" name="date"
                                   placeholder="" disabled readonly>
                        </div>
                        <label>@lang("$string_file.url") </label>
                        <div class="form-group">
                            <input type="url" class="form-control" id="url"
                                   name="url"
                                   placeholder="@lang("$string_file.url")(@lang("$string_file.optional"))">
                            <label class="danger">@lang("$string_file.example") : https://www.google.com/</label>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <input type="reset" class="btn btn-outline-secondary btn" data-dismiss="modal"
                               value="@lang("$string_file.close")">
                        <input type="submit" class="btn btn-outline-primary btn" value="@lang("$string_file.send")">
                    </div>
                </form>
            </div>
        </div>
    </div>



    <!-- Import User Modal -->
    <div class="modal fade" id="importModal" tabindex="-1" role="dialog" aria-labelledby="importModalLabel"
         aria-hidden="true">
        <div class="modal-dialog modal-lg" role="document">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="importModalLabel">
                        @lang("$string_file.import") @lang("$string_file.customer") @lang("$string_file.from") {{$merchant->BusinessName}}
                    </h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>

                <div class="modal-body">
                    <div class="form-group">
                        <div class="row">
                            <div class="col-md-4">
                                <label for="searchUser">@lang("$string_file.service_area")</label>
                                <select class="form-control" name="phone_code" id="phone_code"
                                        required>
                                    <option value="">@lang("$string_file.select")</option>
                                    @foreach($countries  as $country)
                                        <option data-min="{{ $country->minNumPhone }}"
                                                data-max="{{ $country->maxNumPhone }}"
                                                data-ISD="{{ $country->phonecode }}" value="{{ $country->phonecode }}">{{  $country->country_name }} ( {{ $country->phonecode }} )</option>
                                    @endforeach
                                </select>
                            </div>
                            <div class="col-md-8">
                                <label for="searchUser"> @lang("$string_file.phone")</label>
                                <input type="text" id="searchUser" class="form-control" placeholder="Search">
                            </div>
                        </div>
                    </div>

                    <!-- Results Area -->
                    <div id="searchResults" style="display:none; margin-top:15px;">
                        <h6>@lang("$string_file.user_details")</h6>
                        <table class="table table-bordered">
                            <tbody id="userDetails"></tbody>
                        </table>

                        <!-- Designation Select -->
                        <br>
                        <div class="form-group mt-3">
                            <label for="designation">@lang("$string_file.designation")</label>
                            <select id="designation" class="form-control">
                                @foreach($designations as $designation)
                                    <option value="{{ $designation->id }}">{{ $designation->designation_name }}</option>
                                @endforeach
                            </select>
                        </div>
                    </div>

                    <!-- No result -->
                    <div id="noResults" class="alert alert-warning" style="display:none;">

                    </div>

                    <div id="result_found" class="alert alert-success" style="display:none;">
                        @lang("$string_file.user_found")<br>
                        <span id="searched_user_name"></span>
                    </div>
                    <div id="otp_verify" class="" style="display:none;">
                        <input type="text" name="otp" id="otp" class="form-control" placeholder="Enter OTP">
                        <button type="button" id="verifyOtp"
                                class="btn btn-primary mt-2">@lang("$string_file.verify")</button>
                    </div>

                    <div class="form-group" style="display:none;" id="approver_box">
                        <label class="form-check-label" for="need_approver">Need Approver</label>
                        <select class="form-control" name="need_approver" id="need_approver">
                            <option value="">@lang("$string_file.select")</option>
                            <option value="1">@lang("$string_file.yes")</option>
                            <option value="2">@lang("$string_file.no")</option>
                        </select>
                    </div>

                    <!-- Approver Multi-select (hidden by default) -->
                    <div class="form-group mt-3" id="approverSelectBox" style="display:none;">
                        <label for="approvers">Select Approvers</label>
                        <select id="approvers" name="approvers[]" class="form-control" multiple>
                            @foreach($approvers as $user)
                                <option value="{{ $user->id }}">{{ $user->first_name }} {{ $user->last_name }}</option>
                            @endforeach
                        </select>
                    </div>



                </div>

                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary"
                            data-dismiss="modal">@lang("$string_file.close")</button>
                    <button type="button" id="importUserBtn" class="btn btn-primary" disabled>
                        @lang("$string_file.import")
                    </button>
                </div>
            </div>
        </div>
    </div>


    <div class="modal fade" id="removeModal" tabindex="-1" role="dialog" aria-labelledby="removeModalLabel" aria-hidden="true">
        <div class="modal-dialog" role="document">
            <form method="POST" action="{{route('corporate.user.remove-from-corporate')}}">
                @csrf
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="removeModalLabel">@lang("$string_file.remove") @lang("$string_file.user") @lang("$string_file.from") @lang("$string_file.corporate")</h5>
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                    <div class="modal-body">

                        <input type="hidden" name="user_id" id="user_id">

                        <div class="d-flex align-items-center mb-3">
                            <div class="bg-warning bg-opacity-25 rounded-circle p-3 me-3">
                                <i class="bi bi-exclamation-triangle-fill text-warning fs-2"></i>
                            </div>
                            <div>
                                <h5 class="mb-1">@lang("$string_file.are_you_sure")?</h5>
                                {{--                            <p class="text-muted mb-0">--}}
                                {{--                                @lang("$string_file.this_action_cannot_be_undone")--}}
                                {{--                            </p>--}}
                            </div>
                        </div>

                        <div class="border rounded p-3 bg-light">
                            <span class="text-muted">@lang("$string_file.remove") : </span>
                            <span id="user_name_feild" class="badge bg-danger ms-1 fs-6"></span>
                        </div>

                    </div>


                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                        <button type="submit" class="btn btn-danger">@lang("$string_file.remove")</button>
                    </div>
                </div>
            </form>
        </div>
    </div>

    <div class="modal fade" id="updateApproverModal" tabindex="-1" role="dialog" aria-labelledby="updateApproverModalLabel" aria-hidden="true">
        <div class="modal-dialog" role="document">
            <form method="POST" action="{{route('corporate.user.update-user-approvers')}}">
                @csrf
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="updateApproverModalLabel">@lang("$string_file.update") @lang("$string_file.user") @lang("$string_file.details")</h5>
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                    <div class="modal-body">

                        <input type="hidden" name="user" id="user">

                        <div class="form-group" id="update_approver_box">
                            <label class="form-check-label" for="update_need_approver">Need Approver</label>
                            <select class="form-control" name="need_approver" id="update_need_approver">
                                <option value="1">@lang("$string_file.yes")</option>
                                <option value="2">@lang("$string_file.no")</option>
                            </select>
                        </div>

                        <div class="form-group mt-3" id="approverSelectBox2" >
                            <label for="approvers">Select Approvers</label>
                            <select id="update_approvers" name="update_approvers[]" class="form-control" multiple>
                                @foreach($approvers as $user)
                                    <option value="{{ $user->id }}">{{ $user->first_name }} {{ $user->last_name }}</option>
                                @endforeach
                            </select>
                        </div>

                    </div>


                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                        <button type="submit" class="btn btn-success">@lang("$string_file.save")</button>
                    </div>
                </div>
            </form>
        </div>
    </div>

@endsection
@section('js')
    <script src="https://unpkg.com/sweetalert/dist/sweetalert.min.js"></script>
    <script>
        function DeleteEvent(id) {
            var token = $('[name="_token"]').val();
            swal({
                title: "@lang("$string_file.are_you_sure")",
                text: "@lang("$string_file.delete_warning")",
                icon: "warning",
                buttons: true,
                dangerMode: true,
            }).then((isConfirm) => {
                if (isConfirm) {
                    $.ajax({
                        headers: {
                            'X-CSRF-TOKEN': token
                        },
                        method: 'POST',
                        type: "DELETE",
                        data: {id: id},
                        url: "{{ route('corporate.user.destroy') }}",
                    }).done(function (data) {
                        swal({
                            title: "DELETED!",
                            text: data,
                            type: "success",
                        });
                        window.location.href = "{{ route('user.index') }}";
                    });
                } else {
                    swal("@lang("$string_file.data_is_safe")");
                }
            });
        }


        $(document).ready(function() {

        $('#importModal').on('shown.bs.modal', function () {
            $('#approvers').select2({
                dropdownParent: $('#importModal'),
                width: '100%'   // makes it responsive to form-control width
            });
        });

            // Search user
            $('#searchUser').on('keyup', function() {
                let phone_code = $('#phone_code').val();
                let query = $(this).val();
                let search_type = $("#search_type").val();

                if (query.length < 5) {
                    $('#searchResults').hide();
                    $('#noResults').text("User not found ");
                    $('#noResults').show();
                    $('#result_found').hide();
                    $('#otp_verify').hide();
                    return;
                }

                $.ajax({
                    url: "{{route('corporate.search.user')}}",
                    method: "POST",
                    data: {
                        search_text: query,
                        phone_code: phone_code,
                        search_type: search_type,
                        corporate_id: "{{$corporate_id}}",
                        _token: "{{csrf_token()}}"
                    },
                    success: function(response) {
                        if (response.user) {
                            // User found
                            $('#noResults').hide();
                            let txt = "@lang("$string_file.name") : "+response.user.first_name+" "+response.user.last_name;
                            $('#searched_user_name').text(txt)
                            $('#result_found').show();

                            // Save user info temporarily
                            localStorage.setItem("searched_user", JSON.stringify(response.user));

                            // Show SEND OTP button (instead of OTP input directly)
                            $('#otp_verify').html(`
                                <button type="button" id="sendOtp" class="btn btn-warning mt-2">
        @lang("$string_file.send_otp")
        </button>
        `).show();

        $('#searchResults').hide();
        $('#importUserBtn').prop('disabled', true);

    } else {
        $('#searchResults').hide();
        $('#result_found').hide();
        $('#otp_verify').hide();
        $('#noResults').text(response.message);
        $('#noResults').show();
        $('#importUserBtn').prop('disabled', true);
    }
    },
    error: function() {
    $('#searchResults').hide();
    $('#result_found').hide();
    $('#otp_verify').hide();
    $('#noResults').text(response.message);
    $('#noResults').show();
    $('#importUserBtn').prop('disabled', true);
    }
    });
    });

    // Delegate click for SEND OTP
    $(document).on('click', '#sendOtp', function() {
    let user = JSON.parse(localStorage.getItem("searched_user"));

    $.ajax({
    url: "{{route('corporate.send-otp')}}",
                                    method: "POST",
                                    data: {
                                        user_id: user.id,
                                        _token: "{{csrf_token()}}"
                                            },
                                            success: function(otpRes) {
                                                // For demo, save OTP in localStorage (in real, don't expose it!)
                                                localStorage.setItem("user_otp", otpRes.otp);

                                                // Replace SEND OTP with OTP input + Verify button
                                                $('#otp_verify').html(`
                                                    <input type="text" name="otp" id="otp" class="form-control" placeholder="Enter OTP">
                                                    <button type="button" id="verifyOtp" class="btn btn-primary mt-2">
        @lang("$string_file.verify")
        </button>
    `);
}
});
});

// Delegate click for VERIFY OTP
// Delegate click for VERIFY OTP (via AJAX)
    $(document).on('click', '#verifyOtp', function() {
        let enteredOtp = $('#otp').val();
        let user = JSON.parse(localStorage.getItem("searched_user"));

        $.ajax({
            url: "{{ route('corporate.get-otp') }}",
                                    method: "POST",
                                    data: {
                                        _token: "{{ csrf_token() }}",
                                        user_id: user.id,
                                        otp: enteredOtp
                                    },
                                    success: function(response) {
                                    console.log(response)
                                        if (response.success) {
                                            $('#otp_verify').hide();
                                            $('#result_found').hide();
                                            $('#searchResults').show();

                                            $('#userDetails').html(`
                                                <tr><th>ID</th><td>${response.user.id}</td></tr>
                                                <tr><th>Name</th><td>${response.user.first_name} ${response.user.last_name}</td></tr>
                                                <tr><th>Email</th><td>${response.user.email ?? '-'}</td></tr>
                                                <tr><th>Phone</th><td>${response.user.UserPhone ?? '-'}</td></tr>
                                            `);

                                            $('#importUserBtn').prop('disabled', false);
                                            $('#approver_box').css("display", "block");
                                        } else {
                                            alert(response.message);
                                        }
                                    },
                                    error: function(xhr) {
                                        let res = xhr.responseJSON;
                                        alert(res.message || "Invalid OTP, please try again!");
                                    }
                                });
                            });

                        // Import User
                        $('#importUserBtn').on('click', function() {
                        let designationId = $('#designation').val();
                        let userId = $('#userDetails tr:first td').text();

                        if (!designationId) {
                        alert("Please select a designation before importing!");
                        return;
                        }

                        $.ajax({
                        url: "{{route('corporate.import.user')}}",
                                            method: "POST",
                                            data: {
                                                _token: "{{ csrf_token() }}",
                                                user_id: userId,
                                                designation_id: designationId,
                                                corporate_id: "{{ $corporate_id }}",
                                                need_approver: $('#need_approver').val(),
                                                approvers: $('#approvers').val()
                                            },
                                            success: function() {
                                                $('#importModal').modal('hide');
                                                window.location.reload();
                                            }
                                        });
                                    });
                                });


        document.getElementById('need_approver').addEventListener('change', function() {
            let approverBox = document.getElementById('approverSelectBox');
            if (this.value == 1) {
                approverBox.style.display = 'block';
            } else {
                approverBox.style.display = 'none';
            }
        });

        {{--    function handleApprovalModal(userId) {--}}
        {{--        // Clear old data--}}
        {{--        $("#approvalTable tbody").html('<tr><td colspan="4">Loading...</td></tr>');--}}
        {{--    --}}
        {{--        $.ajax({--}}
        {{--            url: "{{route('corporate.bookings.pending.approval')}}",   // ðŸ”¹ your backend route--}}
        {{--            type: "POST",--}}
        {{--            data: { user_id: userId, _token: "{{csrf_token()}}" },--}}
        {{--            success: function (response) {--}}
        {{--                let rows = '';--}}
        {{--                if (response.bookings && response.bookings.length > 0) {--}}
        {{--                    response.bookings.forEach(function (booking, index) {--}}
        {{--                        rows += `<tr>--}}
        {{--                            <td>${index + 1}</td>--}}
        {{--                            <td>${booking.user.first_name} ${booking.user.last_name}</td>--}}
        {{--                            <td>${booking.user.UserPhone}</td>--}}
        {{--                            <td><a class="btn btn-icon btn-success ml-20" href="https://www.google.com/maps/place/${encodeURIComponent(booking.pickup_location)}" target="_blank"><i class="icon wb-map"></i></a></td>--}}
        {{--                            <td><a class="btn btn-icon btn-danger ml-20" href="https://www.google.com/maps/place/${encodeURIComponent(booking.drop_location)}" target="_blank"><i class="icon fa-tint"></a></td>--}}
        {{--                            <td>${booking.later_booking_date} ${booking.later_booking_time}</td>--}}
        {{--                            <td>--}}
        {{--                                <a href="{{route('approve.corporate.ride')}}?booking_id=${booking.id}&approver=${userId}"--}}
        {{--                                   class="btn btn-success btn-sm">--}}
        {{--                                   Approve--}}
        {{--                                </a>--}}
        {{--                            </td>--}}
        {{--                        </tr>`;--}}
        {{--                    });--}}
        {{--                } else {--}}
        {{--                    rows = `<tr><td colspan="8">No bookings found</td></tr>`;--}}
        {{--                }--}}
        {{--                $("#approvalTable tbody").html(rows);--}}
        {{--            },--}}
        {{--            error: function () {--}}
        {{--                $("#approvalTable tbody").html('<tr><td colspan="4">Error loading data</td></tr>');--}}
        {{--            }--}}
        {{--        });--}}
        {{--    }--}}


        function handleRemoveModal(user_id, user_name){
            $('#user_id').val(user_id);
            $('#user_name_feild').text(user_name);
            $('#removeModal').modal('show');
        }

        {{--    function handleUpdateApproverModal(user_id, need_for_approval, approver_ids){--}}
        {{--        $('#approverSelectBox2').select2({--}}
        {{--            dropdownParent: $('#updateApproverModal'),--}}
        {{--            width: '100%'--}}
        {{--        });--}}

        {{--        let selectedApprovers = [];--}}
        {{--        try {--}}
        {{--            selectedApprovers = JSON.parse(approver_ids);--}}
        {{--        } catch (e) {--}}
        {{--            console.error("approver_ids not valid JSON:", approver_ids);--}}
        {{--        }--}}

        {{--        $('#user').val(user_id);--}}
        {{--        $('#approverSelectBox2').val(selectedApprovers).trigger('change');--}}

        {{--        $('#updateApproverModal').modal('show');--}}
        {{--    }--}}


        $(document).ready(function () {
           $('#update_approvers').select2({
               dropdownParent: $('#updateApproverModal'),
               width: '100%'
           });
       });


       $('#updateApproverModal').on('show.bs.modal', function (event) {
           let button = $(event.relatedTarget);

           let userId = button.data('user-id');
           let needForApproval = button.data('need-for-approval');
           let approverIds = button.data('approver-ids'); // e.g., "[168771,168772]"

           $('#user').val(userId);
           $('#update_need_approver').val(needForApproval);

           // Parse approver IDs as array
           let selectedApprovers = approverIds;

           // Set selected options in Select2
           $('#update_approvers').val(selectedApprovers).trigger('change');
       });




    </script>
@endsection

