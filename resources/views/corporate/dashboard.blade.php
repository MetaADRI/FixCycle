@extends('corporate.layouts.main')
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
                <div class="alert dark alert-icon alert-error alert-dismissible" role="alert">
                    <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                        <span aria-hidden="true">x</span>
                    </button>
                    <i class="icon fa-warning" aria-hidden="true"></i>{{ session('error') }}
                </div>
            @endif

            @if ($pending_invoice > 0 && !empty($pending_invoice_msg))
                <div class="alert alert-danger alert-dismissible fade show" role="alert">
                    {{$pending_invoice_msg}}
                    <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
            @endif
            <!-- First Row -->
            <!-- Example Panel With Heading -->
            <div class="panel panel-bordered">
                <header class="panel-heading">
                    <div class="panel-actions"></div>
                    <h3 class="panel-title">@lang("$string_file.service_statistics")</h3>
                </header>
                <div class="panel-body">
                    <div class="row" >
                        <div class="col-xl-3 col-md-3 col-sm-6 info-panel">
                            <a href="{{ route('user.index') }}">
                                <div class="card card-shadow" style="margin-bottom:0.243rem">
                                    <div class="card-block bg-white p-20">
                                        <button type="button" class="btn btn-floating btn-sm btn-success"  style="box-shadow:0 4px 1px rgba(0,0,0,.63)">
                                            <i class="icon fa-cab"></i>
                                        </button>
                                        <span class="ml-10 font-weight-400">@lang("$string_file.users")</span>
                                        <div class="content-text text-center mb-0">
                                            <span class="font-size-18 font-weight-100">{{$users}}</span>
                                        </div>
                                    </div>
                                </div>
                            </a>
                        </div>
                        <div class="col-xl-3 col-md-3 col-sm-6 info-panel">
                            <a href="{{ route('corporate.all.ride') }}">
                                <div class="card card-shadow" style="margin-bottom:0.243rem">
                                    <div class="card-block bg-white p-20">
                                        <button type="button" class="btn btn-floating btn-sm btn-warning"  style="box-shadow:0 4px 1px rgba(0,0,0,.63)">
                                            <i class="icon fa-flag"></i>
                                        </button>
                                        <span class="ml-10 font-weight-400">@lang("$string_file.total")</span>
                                        <div class="content-text text-center mb-0">
                                            <span class="font-size-18 font-weight-100">{{$total_booking}}</span>
                                        </div>
                                    </div>
                                </div>
                            </a>
                        </div>
                        <div class="col-xl-3 col-md-3 col-sm-6 info-panel">
                            <a href="{{ route('corporate.activeride') }}">
                                <div class="card card-shadow" style="margin-bottom:0.243rem">
                                    <div class="card-block bg-white p-20">
                                        <button type="button" class="btn btn-floating btn-sm btn-primary"
                                                style="box-shadow:0 4px 1px rgba(0,0,0,.63)">
                                            <i class="icon wb-users"></i>
                                        </button>
                                        <span class="ml-10 font-weight-400">@lang("$string_file.on_going")</span>
                                        <div class="content-text text-center mb-0">
                                            <span class="font-size-18 font-weight-100">0</span>
                                        </div>
                                    </div>
                                </div>
                            </a>
                        </div>
                        {{--                                    <div class="col-xl-3 col-md-3 col-sm-6 info-panel">--}}
                        {{--                                        <a href="@if(Auth::user('merchant')->can('view_corporate')) {{ route('merchant.cancelride') }} @else # @endif">--}}
                        {{--                                            <div class="card card-shadow" style="margin-bottom:0.243rem">--}}
                        {{--                                                <div class="card-block bg-white p-20">--}}
                        {{--                                                    <button type="button" class="btn btn-floating btn-sm btn-danger"  style="box-shadow:0 4px 1px rgba(0,0,0,.63)">--}}
                        {{--                                                        <i class="icon wb-file"></i>--}}
                        {{--                                                    </button>--}}
                        {{--                                                    <span class="ml-10 font-weight-400">@lang("$string_file.cancelled")</span>--}}
                        {{--                                                    <div class="content-text text-center mb-0">--}}
                        {{--                                                        <span class="font-size-18 font-weight-100">0</span>--}}
                        {{--                                                    </div>--}}
                        {{--                                                </div>--}}
                        {{--                                            </div>--}}
                        {{--                                        </a>--}}
                        {{--                                    </div>--}}
                        <div class="col-xl-3 col-md-3 col-sm-6 info-panel">
                            <a href="{{ route('corporate.completeride') }}">
                                <div class="card card-shadow" style="margin-bottom:0.243rem">
                                    <div class="card-block bg-white p-20">
                                        <button type="button" class="btn btn-floating btn-sm btn-info"  style="box-shadow:0 4px 1px rgba(0,0,0,.63)">
                                            <i class="icon fa-calculator"></i>
                                        </button>
                                        <span class="ml-10 font-weight-400">@lang("$string_file.completed")</span>
                                        <div class="content-text text-center mb-0">
                                            <span class="font-size-18 font-weight-100">{{$complete_booking}}</span>
                                        </div>
                                    </div>
                                </div>
                            </a>
                        </div>
                    </div>
                </div>
            </div>


{{--                <div class="col-12 col-md-12 col-sm-12">--}}
{{--                    <!-- Example Panel With Heading -->--}}
                    <div class="panel panel-bordered">
                        <div class="panel-heading">
                            <div class="panel-actions">
                            </div>
                            <h3 class="panel-title">@lang("$string_file.report")</h3>
                        </div>
                        <div class="panel-body">
                            <div class="row">
                                <div class="col-md-6">
                                    <canvas id="barChart"></canvas>
                                </div>
                                <div class="col-md-6">
                                    <canvas id="lineChart"></canvas>
                                </div>
                            </div>
                            <br><br>   <br><br>    <br><br>
                            <div class="row">
                                <div class="col-md-6">
                                    <canvas id="donut"></canvas>
                                </div>
                                <div class="col-md-6">
                                    <canvas id="radar"></canvas>
                                </div>
                            </div>

                            <div class="row">

                            </div>
                        </div>
                    </div>
{{--                </div>--}}

        </div>
    </div>
@endsection
@section('js')
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

    <script>
        const ctx = document.getElementById('barChart');
          new Chart(ctx, {
            type: 'bar',
            data: {
              labels: @json($taxi_stats['labels']),
              datasets: [{
                    label: '{{$taxi_stats['heading']}}',
                    data: @json($taxi_stats['values']),
                    backgroundColor: [
                      'rgba(255, 99, 132, 0.2)',
                      'rgba(255, 159, 64, 0.2)',
                      'rgba(255, 205, 86, 0.2)',
                      'rgba(75, 192, 192, 0.2)',
                      'rgba(54, 162, 235, 0.2)',
                      'rgba(153, 102, 255, 0.2)',
                      'rgba(201, 203, 207, 0.2)'
                    ],
                    borderColor: [
                      'rgb(255, 99, 132)',
                      'rgb(255, 159, 64)',
                      'rgb(255, 205, 86)',
                      'rgb(75, 192, 192)',
                      'rgb(54, 162, 235)',
                      'rgb(153, 102, 255)',
                      'rgb(201, 203, 207)'
                    ],
                    borderWidth: 1
                  }]
            },
            options: {
              scales: {
                y: {
                  beginAtZero: true
                }
              }
            }
          });



          const ltx = document.getElementById('lineChart');
          new Chart(ltx, {
            type: 'line',
            data: {
              labels: @json($acceptance_ratio['labels']),
              datasets: [{
                   label: '{{$acceptance_ratio['heading']}}',
                    data: @json($acceptance_ratio['values']),
                    fill: false,
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.1
              }]
            },
          });

        const dtx = document.getElementById('donut');
        const donut_data = {
              labels: @json($earnings['labels']),
              datasets: [{
                label: @json($earnings['heading']),
                data: @json($earnings['values']),
                backgroundColor: [
                  'rgb(255, 99, 132)',
                  'rgb(54, 162, 235)',
                ],
                hoverOffset: 4
              }]
            };

          new Chart(dtx, {
            type: 'doughnut',
            data: donut_data,
          });



        const rtx = document.getElementById('radar');
        const radar_data = {
          labels: @json($country_area_bookings['labels']),
          datasets: @json($country_area_bookings['datasets'])
        };
        new Chart(rtx, {
            type: 'radar',
              data: radar_data,
              options: {
                elements: {
                  line: {
                    borderWidth: 3
                  }
                }
              },
          });
    </script>


@endsection
