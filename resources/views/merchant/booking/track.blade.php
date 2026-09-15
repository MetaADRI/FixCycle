@extends('merchant.layouts.main')
@section('content')
    <style>
        #map {
            height: 100%;
        }
        html, body {
            height: 100%;
            margin: 0;
            padding: 0;
        }
    </style>
    <div class="page">
        <div class="page-content">
            <div class="panel panel-bordered">
                <header class="panel-heading">
                    <div class="panel-actions"></div>
                    <h3 class="panel-title"><i class="fas fa-fw fa-map" aria-hidden="true"></i> @lang('admin.driver_tracking_map')</h3>
                </header>
                <div class="panel-body container-fluid">
                    <section id="gmaps-utils">
                        <div class="row">
                            <div class="col-12">
                                <div class="card">
                                    <div class="card-content collapse show">
                                    </div>
                                    <div class="card-body">
                                        <div id="map" style="width: 100%;height: 550px;"></div>
                                        <input type="hidden" id="vehicle_type_image" value="{{view_config_image($booking->VehicleType->vehicleTypeMapImage)}}">
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    </div>
    <br>
@endsection
@section('js')
    <script>

        @php

        $driver = $booking->Driver;
        $lat = $driver->current_latitude;
        $long = $driver->current_longitude;
        $working_with_redis = $booking->Merchant->ApplicationConfiguration->working_with_redis;

        if($working_with_redis == 1){
            $driver_data = getDriverCurrentLatLong($driver);
            $lat =  $driver_data['latitude'];
            $long = $driver_data['longitude'];
        }

        @endphp
        var map;
         //var position = [{{$booking->pickup_latitude}},{{$booking->pickup_longitude}}];
         var position = [{{$lat}},{{$long}}];
        var vehicleTypeImage = document.getElementById('vehicle_type_image').value;

        function initMap() {
            map = new google.maps.Map(document.getElementById('map'), {
                //center: {lat: {{$booking->pickup_latitude}}, lng: {{$booking->pickup_longitude}}},
                center: {lat: {{$lat}}, lng: {{$long}}},
                zoom: 12
            });

            var pickupLat = {{$booking->pickup_latitude}};
            var pickupLng = {{$booking->pickup_longitude}};
            var acceptLat = {{$booking->BookingDetail->accept_latitude}};
            var acceptLng = {{$booking->BookingDetail->accept_longitude}};
            var dropLat = {{$booking->drop_latitude}};
            var dropLng = {{$booking->drop_longitude}};
            var pickupLocation = new google.maps.LatLng(pickupLat, pickupLng);
            var dropLocation = new google.maps.LatLng(dropLat, dropLng);
            var acceptLocation = new google.maps.LatLng(acceptLat, acceptLng);

            // Pickup Marker
            var pickupMarker = new google.maps.Marker({
                position: pickupLocation,
                map: map,
                title: "Pickup Location",
                // label: {
                //     text: "Pickup",
                //     color: "black",
                //     fontWeight: "bold"
                // },
                icon: {
                    url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png' // You can customize this icon
                }
            });

            var pickupInfo = new google.maps.InfoWindow({
                content: "<strong>Pickup Location: </strong><br>{{$booking->pickup_location}}"
            });

            pickupMarker.addListener('click', function () {
                pickupInfo.open(map, pickupMarker);
            });

            // Drop Marker
            var dropMarker = new google.maps.Marker({
                position: dropLocation,
                map: map,
                title: "Drop Location",
                // label: {
                //     text: "Drop",
                //     color: "black",
                //     fontWeight: "bold"
                // },
                icon: {
                    url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
                }
            });


            var dropInfo = new google.maps.InfoWindow({
                content: "<strong>Drop Location</strong><br>{{$booking->drop_location}}"
            });

            dropMarker.addListener('click', function () {
                dropInfo.open(map, dropMarker);
            });

             // Accept Marker
            var acceptMarker = new google.maps.Marker({
                position: acceptLocation,
                map: map,
                title: "Accept Location",
                icon: {
                    url: "{{asset('basic-images/flag-marker.png')}}", // You can customize this icon
                    scaledSize: new google.maps.Size(50, 50)
                }
            });


{{--            var encodedPath = "{{ $booking->ploy_points }}"; --}}
{{--            console.log(encodedPath);--}}
{{--            // Decode polyline using Google Maps geometry library--}}
{{--            var decodedPath = google.maps.geometry.encoding.decodePath(encodedPath);--}}
{{--            --}}
{{--            var routePolyline = new google.maps.Polyline({--}}
{{--                path: decodedPath,--}}
{{--                geodesic: true,--}}
{{--                strokeColor: "#4285F4",   // Blue Google color--}}
{{--                strokeOpacity: 0.8,--}}
{{--                strokeWeight: 5--}}
{{--            });--}}
{{--            --}}
{{--            routePolyline.setMap(map);--}}


            var driverLocation = new google.maps.LatLng({{$lat}},{{$long}});
            var icon = {
                url: vehicleTypeImage, // url
                scaledSize: new google.maps.Size(50, 50), // scaled size
            };
            marker = new google.maps.Marker({
                position: driverLocation,
                map: map,
                animation: google.maps.Animation.DROP,
                icon: icon
            });
            var driver_marker_info = new google.maps.InfoWindow({
                content: '<strong> @lang("$string_file.ride_id") </strong> : {{ $booking->merchant_booking_id}}<br><strong> @lang("$string_file.name") </strong> : {{ $booking->Driver->first_name." ".$booking->Driver->last_name}}<br><strong> @lang("$string_file.vehicle_number")  </strong> : {{$booking->DriverVehicle->vehicle_number}}'
            });
            
            marker.addListener('click', function () {
                driver_marker_info.open(map, marker);
            });
            
            var refreshId = setInterval(function () {
                $.ajax({
                    type: "GET",
                    dataType: "json",
                    url: "{{route('driverTrack')}}",
                    data: 'driver_id=' + {{ $booking->Driver->id}} ,
                    success:
                        function (data) {
                            var lat = data.current_latitude;
                            var long = data.current_longitude;
                            var result = [lat, long];
                            transition(result);
                            var latLng = new google.maps.LatLng(lat, long);
                            map.panTo(latLng);
                        }
                });
            }, 5000);
            var numDeltas = 100;
            var delay = 100; //milliseconds
            var i = 0;
            var deltaLat;
            var deltaLng;

            function transition(result) {
                i = 0;
                deltaLat = (result[0] - position[0]) / numDeltas;
                deltaLng = (result[1] - position[1]) / numDeltas;

                moveMarker();

            }

            function moveMarker() {
                position[0] += deltaLat;
                position[1] += deltaLng;
                var latlng = new google.maps.LatLng(position[0], position[1]);
                marker.setPosition(latlng);
                if (i != numDeltas) {
                    i++;
                    setTimeout(moveMarker, delay);
                }
            }
        }
    </script>
    <script src="https://maps.googleapis.com/maps/api/js?key={{$booking->Merchant->BookingConfiguration->google_key_admin}}&libraries=geometry&callback=initMap"
            async defer></script>
@endsection