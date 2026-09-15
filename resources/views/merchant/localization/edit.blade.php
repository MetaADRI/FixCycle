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
                                <i class="fa fa-language"></i>
                                @lang("$string_file.customize_string")
                                <span class="label label-{{ $app_type == 'user' ? 'primary' : ($app_type == 'driver' ? 'warning' : 'success') }}"
                                      style="font-size:13px;vertical-align:middle;margin-left:8px;">
                                    {{ ucfirst($app_type) }} App
                                </span>
                            </h3>
                        </div>
                        <div class="col-md-6 text-right">
                            <a href="{{ route('merchant.localization.edit') }}?app_type=user"
                               class="btn btn-sm {{ $app_type == 'user' ? 'btn-primary' : 'btn-default' }}">
                                <i class="fa fa-user"></i> User
                            </a>
                            <a href="{{ route('merchant.localization.edit') }}?app_type=driver"
                               class="btn btn-sm {{ $app_type == 'driver' ? 'btn-warning' : 'btn-default' }}">
                                <i class="fa fa-car"></i> Driver
                            </a>
                            <a href="{{ route('merchant.localization.edit') }}?app_type=store"
                               class="btn btn-sm {{ $app_type == 'store' ? 'btn-success' : 'btn-default' }}">
                                <i class="fa fa-shopping-cart"></i> Store
                            </a>
                            <a href="{{ route('merchant.localization.index') }}" class="btn btn-default btn-sm" style="margin-left:6px;">
                                <i class="fa fa-arrow-left"></i> Back to List
                            </a>
                        </div>
                    </div>
                </div>

                <div class="panel-body container-fluid">

                    @if(!empty($localizations) && count($localizations) > 0)

                        {{-- Stats --}}
                        <div class="alert alert-{{ $app_type == 'user' ? 'info' : ($app_type == 'driver' ? 'warning' : 'success') }}">
                            <div class="row">
                                <div class="col-md-2"><strong>App:</strong>
                                    <span class="label label-{{ $app_type == 'user' ? 'primary' : ($app_type == 'driver' ? 'warning' : 'success') }}">
                                        {{ ucfirst($app_type) }}
                                    </span>
                                </div>
                                <div class="col-md-2"><strong>Locale:</strong>
                                    <span class="label label-default">{{ strtoupper($locale) }}</span>
                                </div>
                                <div class="col-md-2"><strong>Total:</strong> {{ $total_strings }}</div>
                                <div class="col-md-2"><strong class="text-success">Translated:</strong> {{ $translated_count }}</div>
                                <div class="col-md-2"><strong class="text-warning">Pending:</strong> {{ $pending_count }}</div>
                                <div class="col-md-2">
                                    <strong>Progress:</strong>
                                    {{ $total_strings > 0 ? round(($translated_count / $total_strings) * 100) : 0 }}%
                                </div>
                            </div>
                        </div>

                        {{-- Filter --}}
                        <form method="GET" action="{{ route('merchant.localization.edit') }}" class="mb-20">
                            <input type="hidden" name="app_type" value="{{ $app_type }}">
                            <div class="row">
                                <div class="col-md-4">
                                    <label>Filter by Module</label>
                                    <select name="module" class="form-control">
                                        <option value="">-- All Modules --</option>
                                        @foreach($configured_modules as $mod)
                                            <option value="{{ $mod }}" {{ $filter_module == $mod ? 'selected' : '' }}>
                                                {{ ucfirst($mod) }}
                                            </option>
                                        @endforeach
                                    </select>
                                </div>
                                <div class="col-md-4">
                                    <label>Search</label>
                                    <input type="text" name="search" class="form-control"
                                           placeholder="Search key or value..." value="{{ $search }}">
                                </div>
                                <div class="col-md-4">
                                    <label>&nbsp;</label><br>
                                    <button type="submit" class="btn btn-primary">
                                        <i class="fa fa-filter"></i> Filter
                                    </button>
                                    <a href="{{ route('merchant.localization.edit') }}?app_type={{ $app_type }}"
                                       class="btn btn-default">
                                        <i class="fa fa-refresh"></i> Reset
                                    </a>
                                </div>
                            </div>
                        </form>

                        {{-- Edit Form --}}
                        <form method="POST" action="{{ route('merchant.localization.update') }}" id="localization-form">
                            @csrf
                            <input type="hidden" name="app_type"  value="{{ $app_type }}">
                            <input type="hidden" name="type_int"  value="{{ $type_int }}">

                            <div class="row">
                                @foreach($localizations as $index => $loc)
                                    <div class="col-md-4 col-sm-6">
                                        <div class="form-group string-card {{ $loc['is_translated'] ? 'translated' : 'pending' }}">
                                            <label>
                                                <span class="string-number">{{ $index + 1 }}.</span>
                                                {{-- key_name is the label — no en_value --}}
                                                {{ $loc['key_name'] }}
                                                @if($loc['is_translated'])
                                                    <i class="fa fa-check-circle text-success pull-right"></i>
                                                @else
                                                    <i class="fa fa-exclamation-circle text-warning pull-right"></i>
                                                @endif
                                            </label>
                                            <div class="string-meta">
                                                <small class="text-muted">
                                                    <strong>Module:</strong> {{ $loc['module'] }} &nbsp;|&nbsp;
                                                    <strong>Screen:</strong> {{ $loc['screen'] }}
                                                </small>
                                            </div>

                                            <input type="hidden" name="items[{{ $index }}][module]"   value="{{ $loc['module'] }}">
                                            <input type="hidden" name="items[{{ $index }}][screen]"   value="{{ $loc['screen'] }}">
                                            <input type="hidden" name="items[{{ $index }}][key_name]" value="{{ $loc['key_name'] }}">

                                            <input
                                                    type="text"
                                                    name="items[{{ $index }}][value]"
                                                    value="{{ old('items.'.$index.'.value', $loc['default_value']) }}"
                                                    class="form-control {{ $loc['is_translated'] ? 'border-success' : '' }}"
                                                    placeholder="Enter translation..."
                                            />

                                        </div>
                                    </div>
                                @endforeach
                            </div>

                            {{-- Fixed Bottom Save Bar --}}
                            <div class="save-bar save-bar-{{ $app_type }}">
                                <div class="container-fluid">
                                    <div class="row">
                                        <div class="col-md-8">
                                            <button type="submit"
                                                    class="btn btn-{{ $app_type == 'user' ? 'primary' : ($app_type == 'driver' ? 'warning' : 'success') }} btn-lg">
                                                <i class="fa fa-save"></i> Save {{ ucfirst($app_type) }} Translations
                                            </button>
                                            <span class="text-muted ml-10">
                                                <i class="fa fa-info-circle"></i>
                                                {{ count($localizations) }} strings &mdash; <strong>{{ strtoupper($locale) }}</strong>
                                            </span>
                                        </div>
                                        <div class="col-md-4 text-right">
                                            <button type="button" class="btn btn-default"
                                                    onclick="window.scrollTo(0,0)">
                                                <i class="fa fa-arrow-up"></i> Top
                                            </button>
                                            <button type="button" class="btn btn-warning" id="scroll-to-pending">
                                                <i class="fa fa-search"></i> First Pending
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </form>

                    @else
                        <div class="alert alert-warning text-center">
                            <i class="fa fa-info-circle"></i>
                            No strings found for <strong>{{ ucfirst($app_type) }}</strong> app.
                            @if($filter_module || $search)
                                Try clearing your filters.
                            @else
                                Please contact admin to add keys for this app type.
                            @endif
                        </div>
                    @endif

                </div>
            </div>
        </div>
    </div>

    <div id="loading-overlay" style="display:none;">
        <div class="loading-content">
            <i class="fa fa-spinner fa-spin fa-3x"></i>
            <p>Saving translations...</p>
        </div>
    </div>
@endsection

@section('css')
    <style>
        .string-card {
            border: 1px solid #e0e0e0;
            padding: 12px;
            background: #fff;
            border-radius: 4px;
            margin-bottom: 15px;
            transition: all 0.2s;
        }
        .string-card:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.1); border-color: #66afe9; }
        .string-card.translated { border-left: 3px solid #5cb85c; }
        .string-card.pending    { border-left: 3px solid #f0ad4e; background-color: #fffbf0; }
        .string-card label {
            font-weight: 600; margin-bottom: 5px; display: block;
            color: #333; font-size: 13px; line-height: 1.4; word-wrap: break-word;
        }
        .string-number { color: #999; font-size: 12px; }
        .string-meta   { margin-bottom: 8px; padding: 4px 0; border-bottom: 1px solid #f0f0f0; }
        .string-meta small { font-size: 11px; color: #777; }
        .ml-10 { margin-left: 10px; }
        .mb-20 { margin-bottom: 20px; }

        .save-bar {
            position: fixed; bottom: 0; left: 0; right: 0;
            background: #fff; border-top: 3px solid #ddd;
            padding: 15px 0; box-shadow: 0 -2px 10px rgba(0,0,0,0.1); z-index: 1000;
        }
        .save-bar-user   { border-top-color: #337ab7; }
        .save-bar-driver { border-top-color: #f0ad4e; }
        .save-bar-store  { border-top-color: #5cb85c; }
        .page-content    { padding-bottom: 80px; }

        #loading-overlay {
            position: fixed; top:0; left:0; right:0; bottom:0;
            background: rgba(0,0,0,0.7); z-index: 9999;
            display: flex; align-items: center; justify-content: center;
        }
        .loading-content {
            background: #fff; padding: 30px 50px;
            border-radius: 8px; text-align: center;
        }
        .loading-content p { margin-top: 15px; font-size: 16px; color: #333; }
    </style>
@endsection

@section('js')
    <script>
        $(document).ready(function () {
            var formChanged = false;

            $('#localization-form').on('submit', function () {
                $('#loading-overlay').fadeIn();
                formChanged = false;
            });

            $('.translation-input').on('input', function () {
                formChanged = true;
                var card = $(this).closest('.string-card');
                if ($(this).val().trim() !== '') {
                    card.removeClass('pending').addClass('translated');
                    card.find('.fa-exclamation-circle')
                        .removeClass('fa-exclamation-circle text-warning')
                        .addClass('fa-check-circle text-success');
                } else {
                    card.removeClass('translated').addClass('pending');
                    card.find('.fa-check-circle')
                        .removeClass('fa-check-circle text-success')
                        .addClass('fa-exclamation-circle text-warning');
                }
            });

            window.addEventListener('beforeunload', function (e) {
                if (formChanged) { e.preventDefault(); e.returnValue = ''; }
            });

            $('#scroll-to-pending').on('click', function () {
                var first = $('.string-card.pending').first();
                if (first.length) {
                    $('html, body').animate({ scrollTop: first.offset().top - 100 }, 500);
                    first.find('input.translation-input').focus();
                } else {
                    alert('All strings are translated!');
                }
            });
        });
    </script>
@endsection