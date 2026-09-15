@extends('corporate.layouts.main')

@section('content')
    <div class="page">
        <div class="page-content container-fluid">
            @if (session('success'))
                <div class="alert alert-success alert-dismissible fade show" role="alert">
                    {{ session('success') }}
                    <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
            @endif

            @if ($errors->any())
                <div class="alert alert-danger alert-dismissible fade show" role="alert">
                    <ul class="mb-0">
                        @foreach ($errors->all() as $error)
                            <li>{{ $error }}</li>
                        @endforeach
                    </ul>
                    <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
            @endif


            <div class="row">
                <div class="col-md-12">
                    <div class="panel">
                        <div class="panel-heading">
                            <h3 class="panel-title">@lang("$string_file.invoice_from_admin")</h3>
                        </div>

                        <div class="panel-body">
                            <table class="table table-striped table-bordered">
                                <thead>
                                <tr>
                                    <th>#</th>
                                    <th>@lang("$string_file.settlement") @lang("$string_file.from") @lang("$string_file.date")</th>
                                    <th>@lang("$string_file.settlement") @lang("$string_file.to") @lang("$string_file.date")</th>
                                    <th>@lang("$string_file.settlement") @lang("$string_file.type")</th>
                                    <th>@lang("$string_file.status")</th>
                                    <th>@lang("$string_file.total") @lang("$string_file.amount")</th>
                                    <th>@lang("$string_file.action")</th>
                                </tr>
                                </thead>
                                <tbody>
                                @forelse($invoices as $invoice)
                                    <tr>
                                        <td>{{ $invoice->id }}</td>
                                        <td>{{ !empty($invoice->settlement_from_date) ? \Carbon\Carbon::parse($invoice->settlement_from_date)->format('Y-m-d'): "------" }}</td>
                                        <td>{{ \Carbon\Carbon::parse($invoice->settlement_date)->format('Y-m-d') }}</td>
                                        <td>
                                            @switch($invoice->settlement_type)
                                                @case(1) @lang("$string_file.weekly") @break
                                                @case(2) @lang("$string_file.bi_weekly") @break
                                                @case(3) @lang("$string_file.monthly") @break
                                                @case(4) @lang("$string_file.custom") @lang("$string_file.days") @break
                                                @default N/A
                                            @endswitch
                                        </td>
                                        <td>
                                            @if($invoice->status == 1)
                                                <span class="badge badge-success">Settled</span>
                                            @elseif($invoice->status == 2)
                                                <span class="badge badge-danger">Unsettled</span>
                                            @elseif($invoice->status == 3)
                                                <span class="badge badge-warning">Uploaded</span>
                                            @elseif($invoice->status == 4)
                                                <span class="badge badge-warning">Partial Settled</span>
                                            @endif

                                        </td>
                                        <td>
                                            {{ number_format($invoice->settlement_amount, 2) }}
                                        </td>
                                        <td>

                                            @if($invoice->status == 1)
                                                <a href="#"  class="btn btn-sm btn-success" >
                                                    settled
                                                </a>

                                            @else
                                                <a href="" data-toggle="modal" data-target="#exampleModal" class="btn btn-sm btn-primary" onclick="setInvoiceId('{{$invoice->id}}')")>
                                                    @lang("$string_file.upload")  @lang("$string_file.receipt")
                                                </a>

                                            @endif


                                            <a  class="btn btn-sm btn-primary" onclick="fetchdetails('{{$invoice->id}}')">
                                                @lang("$string_file.view")  @lang("$string_file.details")
                                            </a>
                                        </td>
                                    </tr>
                                @empty
                                    <tr>
                                        <td colspan="7" class="text-center">No invoices found.</td>
                                    </tr>
                                @endforelse
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="modal fade" id="exampleModal" tabindex="-1" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true">
        <div class="modal-dialog" role="document">
            <form id="uploadForm" enctype="multipart/form-data" method="POST" action="{{route('corporate.invoices.upload')}}">
                @csrf
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="exampleModalLabel">@lang("$string_file.upload") @lang("$string_file.receipt")</h5>
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>

                    <div class="modal-body">
                        <!-- Hidden input for corporate_invoice_id -->
                        <input type="hidden" name="corporate_invoice_id" id="corporate_invoice_id" value="">

                        <!-- File input for receipt upload -->
                        <div class="form-group">
                            <label for="receipt">@lang("$string_file.upload") @lang("$string_file.receipt")</label>
                            <input type="file" class="form-control-file" id="receipt" name="receipt" required>
                        </div>

                        <!-- Remark input -->
                        <div class="form-group">
                            <label for="remark">@lang("$string_file.remarks")</label>
                            <textarea class="form-control" id="remark" name="remark" rows="3" placeholder="Enter a remark (optional)"></textarea>
                        </div>
                    </div>

                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                        <button type="submit" class="btn btn-primary">Upload</button>
                    </div>
                </div>
            </form>
        </div>
    </div>


    <!-- Multiple Bookings Modal -->
    <div class="modal fade" id="bookingDetailsModal" tabindex="-1" role="dialog" aria-labelledby="bookingDetailsLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-lg" role="document"> <!-- larger modal -->
            <div class="modal-content">

                <div class="modal-header">
                    <h5 class="modal-title" id="bookingDetailsLabel">Booking Details</h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>

                <div class="modal-body">
                    <div class="table-responsive">
                        <table class="table table-bordered mb-0">
                            <thead class="thead-light">
                            <tr>
                                <th>@lang("$string_file.booking_id")</th>
                                <th>@lang("$string_file.user") @lang("$string_file.name")</th>
                                <th>@lang("$string_file.designation")</th>
                                <th>@lang("$string_file.ride") @lang("$string_file.amount")</th>
                            </tr>
                            </thead>
                            <tbody id="bookingDetailsTableBody">
                            <!-- Rows will be added here by JS -->
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                </div>

            </div>
        </div>
    </div>



@endsection

@section('js')
    <script>
        function setInvoiceId(id){
            document.getElementById("corporate_invoice_id").value = id;
        }

        function fetchdetails(invoice_id) {
        $.ajax({
          url: `{{route("corporate.invoices.details")}}`,
      method: 'POST',
        data: {
            invoice_id: invoice_id,
            _token: '{{ csrf_token() }}'
          },
      dataType: 'json',
      beforeSend: function () {
        $('#bookingDetailsTableBody').html('<tr><td colspan="5">Loading...</td></tr>');
      },
      success: function (bookings) {
        if (bookings.length === 0) {
          $('#bookingDetailsTableBody').html('<tr><td colspan="5">No bookings found.</td></tr>');
          return;
        }

        let rows = '';
        bookings.forEach(function (booking) {
          rows += `
            <tr>
              <td>${booking.merchant_booking_id}</td>
              <td>${booking.user_first_name}</td>
              <td>${booking.designation}</td>
             <td>${(
                    parseFloat(booking.ride_amount) +
                    parseFloat(booking.corporate_charges)
                ).toFixed(2)}</td>

            </tr>`;
        });

        $('#bookingDetailsTableBody').html(rows);
        $('#bookingDetailsModal').modal('show');
      },
      error: function (xhr) {
        alert('Could not load booking data.');
        console.error(xhr);
      }
    });
  }
    </script>
@endsection
