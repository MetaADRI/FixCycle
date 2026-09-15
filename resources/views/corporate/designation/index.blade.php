@extends('corporate.layouts.main')
@section('content')
    <div class="page">
        <div class="page-content">
            @include("merchant.shared.errors-and-messages")
            <div class="panel panel-bordered">
                <header class="panel-heading">
                    <div class="panel-actions">
                        <button type="button" class="btn btn-icon btn-success" data-toggle="modal"
                                data-target="#inlineForm" style="margin: 10px;">
                            <i class="wb-plus" title="@lang("$string_file.add") @lang("$string_file.designation")"></i>
                        </button>
                    </div>
                    <h3 class="panel-title"><i class="fab fa-get-pocket" aria-hidden="true"></i>
                        @lang("$string_file.designation_management")</h3>
                </header>
                <div class="panel-body container-fluid">
                    <table id="customDataTable" class="display nowrap table table-hover table-striped w-full" style="width:100%">
                        <thead>
                        <tr>
                            <th>@lang("$string_file.sn")</th>
                            <th>@lang("$string_file.id")</th>
                            <th>@lang("$string_file.department")</th>
                            <th>@lang("$string_file.designation_name")</th>
                            <th>@lang("$string_file.expense_limit")</th>
                            <th>@lang("$string_file.expense_limit") @lang("$string_file.duration")</th>
                            <th>@lang("$string_file.action")</th>
                        </tr>
                        </thead>
                        <tbody>
                        @php $sr = $designations->firstItem() @endphp
                        @foreach($designations as $designation)
                            <tr>
                                <td>{{ $sr }}</td>
                                <td>#{{ $designation->designation_id }}</td>
                                <td>{{ $designation->Department->name }}</td>
                                <td>{{ $designation->designation_name }}</td>
                                <td>{{ $designation->designation_expense_limit }}</td>
                                <td>
                                    @switch($designation->designation_expense_limit_duration)

                                        @case(1)
                                            @lang("$string_file.weekly")
                                            @break

                                        @case(2)
                                            @lang("$string_file.bi_weekly")
                                            @break

                                        @case(3)
                                            @lang("$string_file.monthly")
                                            @break

                                        @case(4)
                                            {{ $designation->custom_days }} @lang("$string_file.days")
                                            @break

                                    @endswitch



                                </td>
                                <td>
                                    <button type="submit"
                                            class="btn btn-sm btn-warning menu-icon btn_edit action_btn"
                                            onclick="EditDoc(this)"
                                            data-ID="{{ $designation->id }}"
                                            data-Name="{{ $designation->designation_name }}"
                                            data-limit="{{ $designation->designation_expense_limit }}"
                                            data-limit-duration="{{ $designation->designation_expense_limit_duration }}"
                                            data-custom-days="{{ $designation->custom_days }}">
                                        <i class="fa fa-edit" title="Edit"></i>
                                    </button>
                                    <button type="submit" class="btn btn-sm btn-danger menu-icon btn_delete action_btn"
                                            data-Id = "{{$designation->id}}"
                                            onclick="DeleteDesignation(this)"><i class="fa fa-trash" title="Delete"></i>
                                    </button>
                                </td>
                            </tr>
                            @php $sr++  @endphp
                        @endforeach
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
    <div class="modal fade text-left" id="inlineForm" tabindex="-1" role="dialog" aria-labelledby="myModalLabel33"
         aria-hidden="true">
        <div class="modal-dialog" role="document">
            <div class="modal-content">
                <div class="modal-header">
                    <label class="modal-title text-text-bold-600"
                           id="myModalLabel33"><b> @lang("$string_file.add") @lang("$string_file.designation")" </b></label>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <form method="post" enctype="multipart/form-data" action="{{ route('employeeDesignation.store') }}">
                    @csrf
                    <div class="modal-body">
                        <label>@lang("$string_file.designation_name") <span class="text-danger">*</span></label>
                        <div class="form-group">
                            <input type="text" class="form-control" id="name" name="designation_name"
                                   placeholder="" maxlength="80" required>
                            @if ($errors->has('designation_name'))
                                <label class="text-danger">{{ $errors->first('designation_name') }}</label>
                            @endif
                        </div>

                        <label>@lang("$string_file.department") <span class="text-danger">*</span></label>
                        <div class="form-group">
                            <select class="form-control" name="department_id" id="department_id" required>
                                <option value="">select</option>
                                @foreach($departments as $department)
                                    <option value="{{ $department->id }}">{{ $department->name }}</option>
                                @endforeach
                            </select>
                        </div>

                        <label>@lang("$string_file.expense_limit") <span class="text-danger">*</span></label>
                        <div class="form-group">
                            <input type="text" class="form-control" id="expense_limit" name="expense_limit"
                                   placeholder="" maxlength="80" required>
                            @if ($errors->has('expense_limit'))
                                <label class="text-danger">{{ $errors->first('expense_limit') }}</label>
                            @endif
                        </div>

                        <div class="form-group">
                            <label for="firstName3">
                                @lang("$string_file.expense_limit") @lang("$string_file.duration")<span class="text-danger">*</span>
                            </label>
                            <select class="form-control" name="expense_limit_duration" id="expense_limit_duration" required>
                                <option value="">@lang("$string_file.select")</option>
                                <option value="1"  id="weekly">@lang("$string_file.weekly")</option>
                                <option value="2"  id="bi_weekly">@lang("$string_file.bi_weekly")</option>
                                <option value="3"  id="monthly">@lang("$string_file.monthly")</option>
                                <option value="4"  id="custom">@lang("$string_file.custom")</option>
                            </select>
                            @if ($errors->has('settlement_type'))
                                <label class="text-danger">{{ $errors->first('settlement_type') }}</label>
                            @endif
                        </div>

                        <div class="form-group" id="custom_days_wrapper" style="display: none;">
                            <label>@lang("$string_file.days") <span class="text-danger">*</span></label>
                            <input type="number" class="form-control" name="custom_days" id="custom_days" min="1" placeholder="Enter days">
                        </div>

                    </div>
                    <div class="modal-footer">
                        <input type="reset" class="btn btn-secondary" data-dismiss="modal"
                               value="@lang("$string_file.close")">
                        <input type="submit" class="btn btn-primary" value="@lang("$string_file.add")">
                    </div>
                </form>
            </div>
        </div>
    </div>
    <div class="modal fade text-left" id="EditDOc" tabindex="-1" role="dialog" aria-labelledby="myModalLabel33"
         aria-hidden="true">
        <div class="modal-dialog" role="document">
            <div class="modal-content">
                <div class="modal-header">
                    <label class="modal-title text-text-bold-600"
                           id="myModalLabel33"><b> @lang("$string_file.edit_designation") </b></label>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <form method="post" enctype="multipart/form-data" action="{{route('employee.Designation.update')}}">
                    @csrf
                    <div class="modal-body">
                        <label>@lang("$string_file.designation_name")<span class="text-danger">*</span></label>
                        <div class="form-group">
                            <input type="text" class="form-control" id="designation_name" name="designation_name"
                                   placeholder="" maxlength="80" required>
                            <input type="hidden" id="docId" name="designationId">
                        </div>

                        <label>@lang("$string_file.department") <span class="text-danger">*</span></label>
                        <div class="form-group">
                            <select class="form-control" name="department_id" id="department_id" required>
                                <option value="">select</option>
                                @foreach($departments as $department)

                                    <option value="{{ $department->id }}">{{ $department->name }}</option>
                                @endforeach
                            </select>
                        </div>


                        <label>@lang("$string_file.expense_limit")<span class="text-danger">*</span></label>
                        <div class="form-group">
                            <input type="text" class="form-control" id="expense_limit" name="expense_limit"
                                   placeholder="" maxlength="80" required>
                            @if ($errors->has('expense_limit'))
                                <label class="text-danger">{{ $errors->first('expense_limit') }}</label>
                            @endif
                        </div>

                        <label for="firstName3">
                            @lang("$string_file.expense_limit") @lang("$string_file.duration")<span class="text-danger">*</span>
                        </label>
                        <select class="form-control" name="expense_limit_duration" id="expense_limit_duration" required>
                            <option value="" >@lang("$string_file.select")</option>
                            <option value="1"  id="weekly">@lang("$string_file.weekly")</option>
                            <option value="2"  id="bi_weekly">@lang("$string_file.bi_weekly")</option>
                            <option value="3"  id="monthly">@lang("$string_file.monthly")</option>
                            <option value="4"  id="custom">@lang("$string_file.custom")</option>
                        </select>
                        @if ($errors->has('settlement_type'))
                            <label class="text-danger">{{ $errors->first('settlement_type') }}</label>
                        @endif

                        <div class="form-group" id="custom_days_wrapper" style="display: none;">
                            <label>@lang("$string_file.days") <span class="text-danger">*</span></label>
                            <input type="number" class="form-control" name="custom_days" id="custom_days" min="1" placeholder="Enter days">
                        </div>

                    </div>
                    <div class="modal-footer">
                        <input type="reset" class="btn btn-secondary" data-dismiss="modal"
                               value="@lang("$string_file.close")">
                        <input type="submit" class="btn btn-primary" value="@lang("$string_file.update")">
                    </div>
                </form>
            </div>
        </div>
    </div>
    <div class="modal fade text-left" id="DeleteDesignation" tabindex="-1" role="dialog" aria-labelledby="myModalLabel33"
         aria-hidden="true">
        <div class="modal-dialog" role="document">
            <div class="modal-content">
                <div class="modal-header">
                    <label class="modal-title text-text-bold-600"
                           id="myModalLabel33"><b> @lang("$string_file.are_you_sure")</b></label>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <form method="post" enctype="multipart/form-data" action="{{ route('employee.Designation.delete') }}">
                    @csrf
                    <div class="modal-body text-center">
                        <label><b class="text-danger">@lang("$string_file.delete_warning")</b></label>
                        <input type="hidden" id="docId" name="designationId">
                    </div>
                    <div class="modal-footer">
                        <input type="reset" class="btn btn-sm btn-secondary" data-dismiss="modal"
                               value="@lang("$string_file.close")">
                        <input type="submit" class="btn btn-sm btn-danger" value="@lang("$string_file.delete")">
                    </div>
                </form>
            </div>
        </div>
    </div>
@endsection
@section('js')
    <script>

        $(document).ready(function () {
            // Add modal
            $('#expense_limit_duration').on('change', function () {
                if ($(this).val() == 4) {
                    $('#custom_days_wrapper').show();
                    $('#custom_days').attr('required', true);
                } else {
                    $('#custom_days_wrapper').hide();
                    $('#custom_days').removeAttr('required');
                    $('#custom_days').val('');
                }
            });

            // Edit modal
            $('#EditDOc #expense_limit_duration').on('change', function () {
                if ($(this).val() == 4) {
                    $('#EditDOc #custom_days_wrapper').show();
                    $('#EditDOc #custom_days').attr('required', true);
                } else {
                    $('#EditDOc #custom_days_wrapper').hide();
                    $('#EditDOc #custom_days').removeAttr('required');
                    $('#EditDOc #custom_days').val('');
                }
            });
        });

        // function EditDoc(obj) {
        //     let ID = obj.getAttribute('data-ID');
        //     let Name = obj.getAttribute('data-Name');
        //     let limit = obj.getAttribute('data-limit');
        //     let duration = obj.getAttribute('data-limit-duration');
        //     $(".modal-body #expense_limit").val(limit);
        //     $(".modal-body #designation_name").val(Name);
        //     $(".modal-body #docId").val(ID);
        //     $(".modal-body #expense_limit_duration").val(duration);
        //     $('#EditDOc').modal('show');
        // }


        function EditDoc(obj) {
            let ID = obj.getAttribute('data-ID');
            let Name = obj.getAttribute('data-Name');
            let limit = obj.getAttribute('data-limit');
            let duration = obj.getAttribute('data-limit-duration');
            let customDays = obj.getAttribute('data-custom-days'); // pass this from blade

            $("#EditDOc .modal-body #expense_limit").val(limit);
            $("#EditDOc .modal-body #designation_name").val(Name);
            $("#EditDOc .modal-body #docId").val(ID);
            $("#EditDOc .modal-body #expense_limit_duration").val(duration);

            if (duration == 4) {
                $("#EditDOc #custom_days_wrapper").show();
                $("#EditDOc #custom_days").val(customDays);
            } else {
                $("#EditDOc #custom_days_wrapper").hide();
            }

            $('#EditDOc').modal('show');
        }


        function DeleteDesignation(obj) {
            let ID = obj.getAttribute('data-ID');
            $(".modal-body #docId").val(ID);
            $('#DeleteDesignation').modal('show');
        }
    </script>
@endsection