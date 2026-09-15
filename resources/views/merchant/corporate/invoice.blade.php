@extends('merchant.layouts.main')

@section('content')
    <div class="page">


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


        <div class="page-content">
            <div class="panel panel-bordered">
                <header class="panel-heading">
                    <h3 class="panel-title">@lang("$string_file.corporate") @lang("$string_file.invoices")</h3>

                    <div class="panel-actions"></div>
                </header>


                <div class="row">
                    <div class="col-md-12">
                        <div class="panel">


                            <div class="panel-body">
                                <div class="table-responsive">
                                    <table class="table table-striped table-bordered">
                                        <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>@lang("$string_file.corporate") @lang("$string_file.name")</th>
                                            <th>@lang("$string_file.details")</th>
                                            <th>@lang("$string_file.status")</th>
                                            <th>@lang("$string_file.receipt")</th>
                                            <th>@lang("$string_file.remarks")</th>
                                            <th>@lang("$string_file.total") @lang("$string_file.amount")</th>
                                            <th>@lang("$string_file.action")</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        @forelse($invoices as $invoice)
                                            <tr>
                                                <td>{{ $invoice->id }}</td>
                                                <td>{{ $invoice->Corporate->corporate_name ?? 'N/A' }}</td>
                                                <td>@lang("$string_file.settlement") @lang("$string_file.from")
                                                    : {{ !empty($invoice->settlement_from_date) ? \Carbon\Carbon::parse($invoice->settlement_from_date)->format('Y-m-d') : "-----" }}
                                                    <br>@lang("$string_file.settlement") @lang("$string_file.to")
                                                    : {{ \Carbon\Carbon::parse($invoice->settlement_date)->format('Y-m-d') }}
                                                    <br>
                                                    @lang("$string_file.settlement") @lang("$string_file.type"):
                                                    @switch($invoice->settlement_type)
                                                        @case(1) @lang("$string_file.weekly") @break
                                                        @case(2) @lang("$string_file.bi_weekly") @break
                                                        @case(3) @lang("$string_file.monthly") @break
                                                        @case(4) @lang("$string_file.custom") @lang("$string_file.days") @break
                                                        @default N/A
                                                    @endswitch
                                                    <br>
                                                    <a href="javascript:void(0)" class="text-primary" onclick="fetchdetails('{{$invoice->id}}')">
                                                        @lang("$string_file.view") @lang("$string_file.details")
                                                    </a>
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
                                                    @php
                                                        $receipts = $invoice->uploaded_receipt ? json_decode($invoice->uploaded_receipt, true) : [];
                                                    @endphp

                                                    <div class="d-flex flex-wrap gap-2">
                                                        @foreach($receipts as $receipt)
                                                            <a href="{{ get_image($receipt,'corporate_invoice_receipt') }}"
                                                               target="_blank"
                                                               class="receipt-thumb">
                                                                <img src="{{ get_image($receipt,'corporate_invoice_receipt') }}"
                                                                     alt="Receipt"
                                                                     class="img-thumbnail receipt-img">
                                                            </a>
                                                        @endforeach
                                                    </div>


                                                </td>
                                                <td>
                                                @php
                                                    $admin_remarks = $invoice->admin_remarks ? json_decode($invoice->admin_remarks, true) : [];
                                                    $corporate_remarks = $invoice->corporate_remarks ? json_decode($invoice->corporate_remarks, true) : [];
                                                @endphp

                                                @if(!empty($admin_remarks))
                                                        @lang("$string_file.admin") @lang("$string_file.remarks"):- <br>
                                                        @foreach($admin_remarks as $remark)
                                                            {{ $remark }}
                                                        @endforeach
                                                @endif
                                                @if(!empty($corporate_remarks))
                                                        <br> @lang("$string_file.corporate") @lang("$string_file.remarks"):- <br>
                                                        @foreach($corporate_remarks as $remark)
                                                            {{ $remark }}
                                                        @endforeach
                                                @endif

                                                </td>
                                                <td>
                                                    {{ number_format($invoice->settlement_amount, 2) }}
                                                </td>
                                                <td>
                                                    @if($invoice->status == 3 || $invoice->status == 4)
                                                        <div class="btn-group-vertical " role="group">
                                                            <a href="#"
                                                               data-toggle="modal"
                                                               data-target="#exampleModal"
                                                               class="btn btn-sm btn-success mb-1"
                                                               onclick="setInvoiceId('{{ $invoice->id }}', 1)">
                                                                @lang("$string_file.settle")
                                                            </a>
                                                    @endif
                                                    @if($invoice->status == 3 || $invoice->status == 4)
                                                            <a href="#"
                                                               data-toggle="modal"
                                                               data-target="#exampleModal"
                                                               class="btn btn-sm btn-warning mb-1"
                                                               onclick="setInvoiceId('{{ $invoice->id }}', 4)">
                                                                @lang("$string_file.partial") @lang("$string_file.settle")
                                                            </a>
                                                    @endif
                                                    @if($invoice->status == 3  || $invoice->status == 4)
                                                            <a href="#"
                                                               data-toggle="modal"
                                                               data-target="#exampleModal"
                                                               class="btn btn-sm btn-danger"
                                                               onclick="setInvoiceId('{{ $invoice->id }}', 2)">
                                                                @lang("$string_file.unsettle")
                                                            </a>
                                                        </div>
                                                    @endif




                                                </td>
                                            </tr>
                                        @empty
                                            <tr>
                                                <td colspan="8" class="text-center">No invoices found.</td>
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
        </div>

        <div class="modal fade" id="exampleModal" tabindex="-1" role="dialog" aria-labelledby="exampleModalLabel"
             aria-hidden="true">
            <div class="modal-dialog" role="document">
                <form id="uploadForm" method="POST" action="{{route('merchant.corporate.invoices.settle')}}">
                    @csrf
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title"
                                id="exampleModalLabel111"></h5>
                            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                <span aria-hidden="true">&times;</span>
                            </button>
                        </div>

                        <div class="modal-body">
                            <!-- Hidden input for corporate_invoice_id -->
                            <input type="hidden" name="corporate_invoice_id" id="corporate_invoice_id" value="">
                            <input type="hidden" name="settlement_status" id="settlement_status" value="">


                            <!-- Remark input -->
                            <div class="form-group">
                                <label for="admin_remarks">@lang("$string_file.remarks")</label>
                                <textarea class="form-control" id="admin_remarks" name="admin_remarks" rows="3"
                                          required placeholder="Enter a remark"></textarea>
                            </div>
                        </div>

                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                            <button type="submit" class="btn btn-primary">@lang("$string_file.save")</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>


        <!-- Multiple Bookings Modal -->
        <div class="modal fade" id="bookingDetailsModal" tabindex="-1" role="dialog"
             aria-labelledby="bookingDetailsLabel" aria-hidden="true">
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
                                    <th>@lang("$string_file.corporate") @lang("$string_file.charges")</th>
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


    </div>
@endsection

@section('js')
    <script>
        function setInvoiceId(id, status){
           document.getElementById("corporate_invoice_id").value = id;
           document.getElementById("settlement_status").value = status;

           const messages = {
                1: '@lang("$string_file.are_you_sure") @lang("$string_file.to") @lang("$string_file.settle")',
                4: '@lang("$string_file.are_you_sure") @lang("$string_file.to") @lang("$string_file.partial") @lang("$string_file.settle")',
                2: '@lang("$string_file.are_you_sure") @lang("$string_file.to") @lang("$string_file.un") @lang("$string_file.settle")',
            };

            document.getElementById("exampleModalLabel111").innerHTML = messages[status] ?? '';
        }

        function fetchdetails(invoice_id) {
        $.ajax({
          url: `{{route("merchant.corporate.invoice.details")}}`,
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
              <td>${booking.ride_amount}</td>
              <td>${booking.corporate_charges}</td>
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
