@php($string_file = 'corporate')
@extends('corporate.layouts.main')

@section('title', __('General Settings'))

@section('content')
<div class="page">
    <div class="page-content container-fluid">
        <div class="row">
            <div class="col-md-12">
                <div class="panel">
                    <div class="panel-heading">
                        <h3 class="panel-title">@lang('General') @lang('Settings')</h3>
                    </div>
                    <div class="panel-body">
                        <p>@lang('This is the corporate settings page. Configure your preferences here.')</p>
                        <!-- Add settings form/components here in future -->
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection
