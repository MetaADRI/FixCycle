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
                                <i class="wb-flag"></i>
                                @lang("$string_file.application_string")
                                <span class="label label-{{ $app_type == 'user' ? 'primary' : ($app_type == 'driver' ? 'warning' : 'success') }}"
                                      style="font-size:13px;vertical-align:middle;margin-left:8px;">
                                    {{ ucfirst($app_type) }} App &nbsp;|&nbsp; {{ strtoupper($locale) }}
                                </span>
                            </h3>
                        </div>
                        <div class="col-md-6 text-right">
                            @if(Auth::user('merchant')->can('edit_language_strings'))
                                <a href="{{ route('merchant.localization.edit', ['app_type' => $app_type]) }}"
                                   class="btn btn-success">
                                    <i class="fa fa-edit"></i> @lang("$string_file.customize_string")
                                </a>
                                <a href="{{ route('merchant.localization.import') }}" class="btn btn-primary">
                                    <i class="fa fa-upload"></i> Import
                                </a>
                            @endif
                        </div>
                    </div>
                </div>

                <div class="panel-body container-fluid">

                    {{-- App Type Switcher --}}
                    <div class="mb-20">
                        <div class="btn-group" role="group">
                            <a href="{{ route('merchant.localization.index', array_merge(request()->except('app_type'), ['app_type' => 'user'])) }}"
                               class="btn {{ $app_type == 'user' ? 'btn-primary' : 'btn-default' }}">
                                <i class="fa fa-user"></i> User App
                            </a>
                            <a href="{{ route('merchant.localization.index', array_merge(request()->except('app_type'), ['app_type' => 'driver'])) }}"
                               class="btn {{ $app_type == 'driver' ? 'btn-warning' : 'btn-default' }}">
                                <i class="fa fa-car"></i> Driver App
                            </a>
                            <a href="{{ route('merchant.localization.index', array_merge(request()->except('app_type'), ['app_type' => 'store'])) }}"
                               class="btn {{ $app_type == 'store' ? 'btn-success' : 'btn-default' }}">
                                <i class="fa fa-shopping-cart"></i> Store App
                            </a>
                        </div>
                    </div>

                    {{-- Progress Summary --}}
                    @php
                        $pending_count = $total_count - $translated_count;
                        $pct = $total_count > 0 ? round(($translated_count / $total_count) * 100) : 0;
                        $bar_color = $pct >= 80 ? 'success' : ($pct >= 40 ? 'warning' : 'danger');
                    @endphp
                    <div class="alert alert-{{ $app_type == 'user' ? 'info' : ($app_type == 'driver' ? 'warning' : 'success') }} mb-20">
                        <div class="row">
                            <div class="col-md-2"><strong>Locale:</strong> {{ strtoupper($locale) }}</div>
                            <div class="col-md-2"><strong>Total:</strong> {{ $total_count }}</div>
                            <div class="col-md-2"><strong class="text-success">Translated:</strong> {{ $translated_count }}</div>
                            <div class="col-md-2"><strong class="text-danger">Pending:</strong> {{ $pending_count }}</div>
                            <div class="col-md-4">
                                <div class="progress" style="margin-bottom:0;margin-top:4px;">
                                    <div class="progress-bar progress-bar-{{ $bar_color }}"
                                         style="width:{{ $pct }}%; min-width:30px;">
                                        {{ $pct }}%
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {{-- Filters --}}
                    <form method="GET" action="{{ route('merchant.localization.index') }}" class="mb-20">
                        <input type="hidden" name="app_type" value="{{ $app_type }}">
                        <div class="row">
                            <div class="col-md-3">
                                <label>Module</label>
                                <select name="module" class="form-control">
                                    <option value="">-- All Modules --</option>
                                    @foreach($modules as $module)
                                        <option value="{{ $module }}"
                                                {{ $filter_module == $module ? 'selected' : '' }}>
                                            {{ ucfirst($module) }}
                                        </option>
                                    @endforeach
                                </select>
                            </div>
                            <div class="col-md-4">
                                <label>Search</label>
                                <input type="text" name="search" class="form-control"
                                       placeholder="Search key name or value..."
                                       value="{{ $search }}">
                            </div>
                            <div class="col-md-3">
                                <label>&nbsp;</label><br>
                                <button type="submit" class="btn btn-primary">
                                    <i class="fa fa-search"></i> Filter
                                </button>
                                <a href="{{ route('merchant.localization.index', ['app_type' => $app_type]) }}"
                                   class="btn btn-default">
                                    <i class="fa fa-refresh"></i> Reset
                                </a>
                            </div>
                            <div class="col-md-2 text-right">
                                <label>&nbsp;</label><br>
                                @if(Auth::user('merchant')->can('edit_language_strings'))
                                    {{-- Quick Export --}}
                                    <form method="POST"
                                          action="{{ route('merchant.localization.export') }}"
                                          style="display:inline;">
                                        @csrf
                                        <input type="hidden" name="app_type" value="{{ $app_type }}">
                                        <input type="hidden" name="format"   value="json">
                                        <button type="submit" class="btn btn-warning">
                                            <i class="fa fa-download"></i> Export JSON
                                        </button>
                                    </form>
                                @endif
                            </div>
                        </div>
                    </form>

                    {{-- Strings Table --}}
                    <div class="table-responsive">
                        <table class="table table-hover table-striped">
                            <thead>
                            <tr>
                                <th>@lang("$string_file.sn")</th>
                                <th>Module</th>
                                <th>Screen</th>
                                <th>Key</th>
                                <th>Value ({{ strtoupper($locale) }})</th>
                                <th>Status</th>
                            </tr>
                            </thead>
                            <tbody>
                            @php $sr = $localizations->firstItem(); @endphp
                            @forelse($localizations as $loc)
                                <tr>
                                    <td>{{ $sr++ }}</td>
                                    <td>{{ ucfirst($loc->module) }}</td>
                                    <td>{{ ucfirst($loc->screen) }}</td>
                                    <td><code>{{ $loc->key_name }}</code></td>
                                    <td>{{ $loc->value ?? '—' }}</td>
                                    <td>
                                        @if(!empty($loc->value))
                                            <span class="label label-success">
                                                    <i class="fa fa-check"></i> Translated
                                                </span>
                                        @else
                                            <span class="label label-warning">
                                                    <i class="fa fa-exclamation"></i> Pending
                                                </span>
                                        @endif
                                    </td>
                                </tr>
                            @empty
                                <tr>
                                    <td colspan="6" class="text-center text-muted">
                                        @lang("$string_file.data_not_found")
                                    </td>
                                </tr>
                            @endforelse
                            </tbody>
                        </table>
                    </div>

                    {{-- Pagination --}}
                    @if($localizations->hasPages())
                        <div class="text-center">
                            {{ $localizations->appends(request()->query())->links() }}
                        </div>
                    @endif

                </div>
            </div>
        </div>
    </div>
@endsection