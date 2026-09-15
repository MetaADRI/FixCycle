@extends('merchant.layouts.main')

@section('content')
    <div class="page">
        <div class="page-content">
            @include('merchant.shared.errors-and-messages')

            <div class="container-fluid py-4">

                @php
                    $driver_states = $arr_data['driver_states'];
                    $site_states = $arr_data['site_states'];
                    $report = $arr_data['report'];
                @endphp
                
                <div class="card border-0 shadow-sm mb-4">
                    <div class="card-body p-4">
                        <h4 class="card-title fw-semibold mb-4 text-dark">Filter</h4>
                            <div class="col-md-12">
                                <select class="form-control" id="select-filter">
                                    <option value="">select Country</option>
                                    @foreach($countries as $country)
                                        <option value="{{$country->id}}">{{$country->CountryName}}</option>
                                    @endforeach
                                </select>
                            </div>
                    </div>
                </div>

                        <!-- Site Statistics -->
                <div class="card border-0 shadow-sm mb-4">
                    <div class="card-body p-4">
                        <h4 class="card-title fw-semibold mb-4 text-dark">Site Statistics</h4>
                        <div class="row g-4 text-center">
                            <div class="col-md-3 col-6">
                                <a href="{{route('users.index')}}">
                                    <div class="stat-item">
                                        <h6 class="text-primary text-uppercase fw-semibold small mb-2 letter-spacing-wide">Active Users</h6>
                                        <p class="display-6 fw-bold text-dark mb-0">{{ $site_states->users }}</p>
                                    </div>
                                </a>
                            </div>
                            <div class="col-md-3 col-6">
                                <a href="{{route('driver.index')}}">
                                    <div class="stat-item">
                                        <h6 class="text-primary text-uppercase fw-semibold small mb-2 letter-spacing-wide">Active Drivers</h6>
                                        <p class="display-6 fw-bold text-dark mb-0">{{ $site_states->drivers }}</p>
                                    </div>
                                </a>
                            </div>
                            <div class="col-md-3 col-6">
                                <a href="{{route('country.index')}}">
                                    <div class="stat-item">
                                        <h6 class="text-primary text-uppercase fw-semibold small mb-2 letter-spacing-wide">Service Countries</h6>
                                        <p class="display-6 fw-bold text-dark mb-0">{{ $site_states->totalCountry }}</p>
                                    </div>
                                </a>
                            </div>
                            <div class="col-md-3 col-6">
                                <a href="{{route('countryareas.index')}}">
                                    <div class="stat-item">
                                        <h6 class="text-primary text-uppercase fw-semibold small mb-2 letter-spacing-wide">Service Area</h6>
                                        <p class="display-6 fw-bold text-dark mb-0">{{ $site_states->totalCountryArea }}</p>
                                    </div>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Driver Statistics -->
                <div class="card border-0 shadow-sm mb-4">
                    <div class="card-body p-4">
                        <h4 class="card-title fw-semibold mb-4 text-dark">Driver</h4>
                        <div class="row g-4 text-center">
                            <div class="col-md-3 col-6">
                                <a href="{{route('merchant.drivermap')}}">
                                    <div class="stat-item">
                                        <h6 class="text-primary text-uppercase fw-semibold small mb-2 letter-spacing-wide">Online Drivers</h6>
                                        <p class="display-6 fw-bold text-dark mb-0">{{ $driver_states->online_drivers }}</p>
                                    </div>
                                </a>
                            </div>
                            <div class="col-md-3 col-6">
                                <a href="{{route('merchant.driver.goingtoexpiredocuments')}}">
                                    <div class="stat-item">
                                        <h6 class="text-primary text-uppercase fw-semibold small mb-2 letter-spacing-wide">Docs near expiry</h6>
                                        <p class="display-6 fw-bold text-dark mb-0">{{ $driver_states->near_doc_expired }}</p>
                                    </div>
                                </a>
                            </div>
                            <div class="col-md-3 col-6">
                                <a href="{{route('merchant.driver.expiredocuments')}}">
                                    <div class="stat-item">
                                        <h6 class="text-primary text-uppercase fw-semibold small mb-2 letter-spacing-wide">Personal Doc Expired</h6>
                                        <p class="display-6 fw-bold text-dark mb-0">{{ $driver_states->personal_doc_expired  }}</p>
                                    </div>
                                </a>
                            </div>
                            <div class="col-md-3 col-6">
                                <a href="{{route('merchant.driver.expiredocuments')}}">
                                <div class="stat-item">
                                    <h6 class="text-primary text-uppercase fw-semibold small mb-2 letter-spacing-wide">Vehicle Doc Expired</h6>
                                    <p class="display-6 fw-bold text-dark mb-0">{{ $driver_states->vehicle_doc_expired }}</p>
                                </div>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Trips -->
                <div class="card border-0 shadow-sm mb-4">
                    <div class="card-body p-4">
                        <h4 class="card-title fw-semibold mb-4 text-dark">Trips</h4>
                        <div class="table-responsive">
                            <table class="table table-bordered table-hover align-middle mb-0">
                                <thead class="table-light">
                                <tr>
                                    <th class="fw-semibold text-dark border-end"></th>
                                    <th class="text-center fw-semibold text-dark">Today</th>
                                    <th class="text-center fw-semibold text-dark">This month</th>
                                    <th class="text-center fw-semibold text-dark">Year To Date</th>
                                    <th class="text-center fw-semibold text-dark">Till date</th>
                                </tr>
                                </thead>
                                <tbody>
                                @php $trips = $report['trips']; @endphp
                                @foreach([
                                    'ongoing_upcoming_trips' => 'Ongoing / Upcoming trips',
                                    'completed_trips' => 'Completed Trips',
                                    'cancelled_trips' => 'Cancelled Trips',
                                    'auto_cancelled_trips' => 'Auto cancelled trips',
                                    'failed_rides' => 'Failed rides',
                                    'all_rides' => 'All rides'
                                ] as $key => $label)
                                    <tr @if($key == 'all_rides') class="table-active" @endif>
                                        <td class="text-primary fw-medium border-end">{{ $label }}</td>
                                        <td class="text-center">{{ $trips['today'][$key] ?? 0 }}</td>
                                        <td class="text-center">{{ $trips['this_month'][$key] ?? 0 }}</td>
                                        <td class="text-center">{{ $trips['year_to_date'][$key] ?? 0 }}</td>
                                        <td class="text-center">{{ $trips['till_date'][$key] ?? 0 }}</td>
                                    </tr>
                                @endforeach
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                @if(Auth::user('merchant')->can('subscription_package'))
                <!-- Subscription -->
                <div class="card border-0 shadow-sm mb-4">
                    <div class="card-body p-4">
                        <h4 class="card-title fw-semibold mb-4 text-dark">Subscription</h4>

                        <!-- Top Stats -->
                        <div class="row g-4 text-center mb-4">
                            <div class="col-md-6">
                                <div class="stat-item">
                                    <h6 class="text-primary text-uppercase fw-semibold small mb-2 letter-spacing-wide">Drivers pending subscription</h6>
                                    <p class="display-6 fw-bold text-dark mb-0">{{ $report['subscription']['drivers_pending_subscription'] }}</p>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="stat-item">
                                    <h6 class="text-primary text-uppercase fw-semibold small mb-2 letter-spacing-wide">Subscription Amount pending</h6>
                                    <p class="display-6 fw-bold text-dark mb-0">{{ $report['subscription']['subscription_amount_pending'] }}</p>
                                </div>
                            </div>
                        </div>

                        <!-- Subscription Table -->
                        <div class="table-responsive">
                            <table class="table table-bordered table-hover align-middle mb-0">
                                <thead class="table-light">
                                <tr>
                                    <th class="fw-semibold text-dark border-end"></th>
                                    <th class="text-center fw-semibold text-dark">Today</th>
                                    <th class="text-center fw-semibold text-dark">This month</th>
                                    <th class="text-center fw-semibold text-dark">Year To Date</th>
                                    <th class="text-center fw-semibold text-dark">Till date</th>
                                </tr>
                                </thead>
                                <tbody>
                                @php $subs = $report['subscription']; @endphp
                                @foreach([
                                    'subscription_earning_mpesa' => 'Subscription earning (MPESA)',
                                    'subscription_earning_wallet' => 'Subscription earning (Wallet)',
                                    'total_discount_amounts' => 'Total Discount amounts',
                                    'total_trip_amounts' => 'Total Trip amounts'
                                ] as $key => $label)
                                    <tr>
                                        <td class="text-primary fw-medium border-end">{{ $label }}</td>
                                        <td class="text-center">{{ $subs['today'][$key] ?? 0 }}</td>
                                        <td class="text-center">{{ $subs['this_month'][$key] ?? 0 }}</td>
                                        <td class="text-center">{{ $subs['year_to_date'][$key] ?? 0 }}</td>
                                        <td class="text-center">{{ $subs['till_date'][$key] ?? 0 }}</td>
                                    </tr>
                                @endforeach
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                @endif

            </div>
        </div>
    </div>

    <style>
        .letter-spacing-wide { letter-spacing: 0.05em; }
        .stat-item { transition: transform 0.2s ease; }
        .stat-item:hover { transform: translateY(-2px); }
        .table-hover tbody tr:hover { background-color: rgba(0, 123, 255, 0.03); }
        .card { border-radius: 0.5rem; }
        .display-6 { font-size: 1.75rem; }
        @media (max-width: 767px) { .display-6 { font-size: 1.5rem; } }
    </style>
@endsection
