@extends('merchant.layouts.main')
@section('content')
    <div class="page">
        <div class="page-content">
            @include("merchant.shared.errors-and-messages")
            <div class="panel panel-bordered">
                <div class="panel-heading">
                    <div class="row">
                        <div class="col-md-6">
                            <h3 class="panel-title">
                                <i class="fa fa-upload"></i>
                                Import Localizations
                            </h3>
                        </div>
                        <div class="col-md-6 text-right">
                            <a href="{{ route('merchant.localization.index') }}" class="btn btn-default">
                                <i class="fa fa-arrow-left"></i> Back to List
                            </a>
                        </div>
                    </div>
                </div>
                <div class="panel-body container-fluid">
                    <form method="POST" action="{{ route('merchant.localization.import.process') }}">
                        @csrf
                        
                        <div class="alert alert-info">
                            <h4><i class="fa fa-info-circle"></i> Import Instructions</h4>
                            <p>Import translations in JSON format with flat keys:</p>
                            <pre>{
  "account_login_title": "Login",
  "account_login_email": "Email",
  "app_common_cancel": "Cancel"
}</pre>
                        </div>

                        <div class="row">
                            <div class="col-md-6">
                                <div class="form-group">
                                    <label>Locale <span class="text-danger">*</span></label>
                                    <input 
                                        type="text" 
                                        name="locale" 
                                        class="form-control" 
                                        placeholder="e.g., en, ar, pt-BR"
                                        pattern="^[a-z]{2}(-[A-Z]{2})?$"
                                        required
                                    >
                                    <small class="text-muted">Use ISO codes like: en, ar, pt-BR</small>
                                </div>
                            </div>
                        </div>

                        <div class="row">
                            <div class="col-md-6">
                                <div class="form-group">
                                    <label>String Type <span class="text-danger">*</span></label>
                                    <select class="form-select" name="app_type" >
                                        <option value="1">USER</option>
                                        <option value="2">DRIVER</option>
                                        <option value="3">STORE</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div class="row">
                            <div class="col-md-12">
                                <div class="form-group">
                                    <label>JSON Data <span class="text-danger">*</span></label>
                                    <textarea 
                                        name="import_data" 
                                        class="form-control" 
                                        rows="15" 
                                        placeholder='{"account_login_title": "Login", "account_login_email": "Email"}'
                                        required
                                    ></textarea>
                                </div>
                            </div>
                        </div>

                        <div class="row">
                            <div class="col-md-12">
                                <button type="submit" class="btn btn-primary">
                                    <i class="fa fa-upload"></i> Import Translations
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
@endsection