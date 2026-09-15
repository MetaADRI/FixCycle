@extends('merchant.layouts.main')
@section('content')

    <div class="page">
        <div class="page-content">
            @if(session('success'))
                <div class="alert dark alert-icon alert-success alert-dismissible" role="alert">
                    <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                        <span aria-hidden="true">x</span>
                    </button>
                    <i class="icon wb-info" aria-hidden="true"></i>{{ session('success') }}
                </div>
            @endif
            @if(session('error'))
                <div class="alert dark alert-icon alert-danger alert-dismissible" role="alert">
                    <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                        <span aria-hidden="true">x</span>
                    </button>
                    <i class="icon fa-warning" aria-hidden="true"></i>{{ session('error') }}
                </div>
            @endif
            @if($errors->all())
                @foreach($errors->all() as $message)
                    <div class="alert dark alert-icon alert-warning alert-dismissible" role="alert">
                        <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                            <span aria-hidden="true">x</span>
                        </button>
                        <i class="icon fa-warning" aria-hidden="true"></i>{{ $message }}
                    </div>
                @endforeach
            @endif
            <div class="panel panel-bordered">
                <header class="panel-heading">
                    <div class="panel-actions">
                        {{-- <a href="{{ route('driver.index') }}" data-toggle="tooltip">
                            <button type="button" class="btn btn-icon btn-success float-right" style="margin:10px">
                                <i class="wb-reply" title="@lang("$string_file.all_drivers")"></i>
                            </button>
                        </a> --}}
                        <a href="{{ route('merchant.business-segment/stripe-connect-sync', $id) }}">
                            <button type="button" class="btn btn-icon btn-dark float-right" style="margin:10px"
                                data-toggle="tooltip" title="Sync">
                                <i class="icon wb-refresh" title="Sync"></i>
                            </button>
                        </a>
                        <a href="{{ route('merchant.business-segment/stripe-connect-delete', $id) }}">
                            <button type="button" class="btn btn-icon btn-danger float-right" style="margin:10px"
                                data-toggle="tooltip" title="Delete">
                                <i class="icon wb-trash" ></i>
                            </button>
                        </a>
                    </div>
                    <h3 class="panel-title"><i class="icon wb-plus" aria-hidden="true"></i>
                        @lang('admin.stripe_connect') : {{ $bs->full_name }} : (
                        {{ ($bs->sc_account_id != NULL) ? $bs->sc_account_id : '---' }} )</h3>
                </header>
                <div class="panel-body container-fluid">
                    <form method="POST" class="steps-validation wizard-notification" enctype="multipart/form-data"
                        action="{{ route('merchant.business-segment.stripe_connect.store', $id) }}">
                        @csrf
                        <div class="row">
                            <div class="col-md-6">
                                <h5>@lang('admin.stripe_connect_status') :
                                 @if ($bs->is_stripe_connect == 1)
                                    Active
                                @elseif ($bs->is_stripe_connect == 2)
                                        {{ ucfirst('unverified') }}
                                @elseif ($bs->is_stripe_connect == 3)
                                     Account is deleted.
                                @else
                                @if($bs->sc_account_id == null )
                                    Account Not Created.
                                    @else
                                    Pending
                                @endif
                                @endif

                            </div>
                        </div>
                        <div class="row">
                            @foreach($require_fields as $field)
                                @if($field['display'])
                                    <div class="form-group col-md-4">
                                        <label for="{{ $field['key'] }}">
                                            {{ $field['display_text'] }}
                                            <span class="text-danger">*</span>
                                        </label>
                    
                                        @switch($field['type'])
                                            @case('text')
                                            @case('number')
                                                <input type="{{ $field['type'] }}" name="{{ $field['key'] }}" id="{{ $field['key'] }}"
                                                       class="form-control"
                                                       @if(isset($field['max'])) maxlength="{{ $field['max'] }}" @endif
                                                       value="{{ old($field['key'], $bs[$field['key']] ?? '') }}" {{ $bs->signup_status == 2 ? 'readonly' : "" }}>
                                                @break
                    
                                            @case('select_dob') {{-- Replace this with input type="date" --}}
                                                <input type="date" name="dob" id="dob" class="form-control"
                                                       value="{{ old('dob', $bs['dob'] ?? '') }}" {{ $bs->signup_status == 2 ? 'readonly' : "" }}>
                                                @break
                    
                                            @case('file')
                                                <input type="file" name="{{ $field['key'] }}" id="{{ $field['key'] }}" class="form-control">
                                                @break
                    
                                            @default
                                                <input type="text" name="{{ $field['key'] }}" id="{{ $field['key'] }}"
                                                       class="form-control"
                                                       value="{{ old($field['key'], $bs[$field['key']] ?? '') }}">
                                        @endswitch
                    
                                        @error($field['key'])
                                            <label class="text-danger">{{ $message }}</label>
                                        @enderror
                                    </div>
                                @endif
                            @endforeach
                        </div>
                        <br>
                        @php
                                $stripe_docs_list_json = json_encode($stripe_docs_list);
                            @endphp
                        @if(!empty($stripe_docs_list) && $bs->signup_status == 3)
                            <h5 class="form-section col-md-12" style="color: black;"><i class="fa fa-address-card"></i>
                                @lang('admin.docs')
                            </h5>
                            <hr>
                            <select id="document_type" name="document_type_id" class="form-control col-md-4">
                                <option value="">-- Select Document Type --</option>
                                @foreach($stripe_docs_list as $doc)
                                    <option value="{{ $doc['id'] }}">{{ $doc['type'] }}</option>
                                @endforeach
                            </select>
                            
                            <div id="upload_fields" class="mt-3 col-md-4"></div>
                        @endif
                        @if($bs->signup_status == 3)
                        <div class="form-actions float-right">
                            <button type="submit" class="btn btn-primary">
                                <i class="fa fa-check-circle"></i>
                                @lang("$string_file.save")
                            </button>
                        </div>
                        @endif
                    </form>
                </div>
            </div>
        </div>
    </div>
@endsection
@section('js')
    <script>
        const stripeDocsList = {!! $stripe_docs_list_json !!};
    
        document.getElementById('document_type').addEventListener('change', function () {
            const selectedId = parseInt(this.value);
            const selectedDoc = stripeDocsList.find(doc => doc.id === selectedId);
            const container = document.getElementById('upload_fields');
    
            container.innerHTML = ''; // clear previous
    
            if (!selectedDoc) return;
    
            if (selectedDoc.requires_front) {
                container.innerHTML += `
                    <div class="form-group">
                        <label for="document_front">Upload Front of ${selectedDoc.type}</label>
                        <input type="file" name="document_front" id="document_front" class="form-control" required>
                    </div>
                `;
            }
    
            if (selectedDoc.requires_back) {
                container.innerHTML += `
                    <div class="form-group">
                        <label for="document_back">Upload Back of ${selectedDoc.type}</label>
                        <input type="file" name="document_back" id="document_back" class="form-control" required>
                    </div>
                `;
            }
        });
    </script>
@endsection