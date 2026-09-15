@extends('merchant.layouts.main')
@section('content')
<div class="page">
 <div class="page-content">
     
     <div class="panel panel-bordered">
                <header class="panel-heading">
 <h3 class="panel-title"><i class="wb-flag" aria-hidden="true"></i>
                       Transactions List </h3>
    </header>
                <div class="panel-body container-fluid">
 <table class="display nowrap table table-hover table-stripedw-full" id="customDataTable" style="width: 100%">
       <thead><tr>
        <th>Id</th>
        <th>Product</th>
        <th>Cell/Meterno</th>
        <th>Ext Txn No</th>
        <th>Amount</th>
        <th>Transaction Id</th>
        <th>Transaction Status</th>
        <th>Details</th>
    </tr>
 </thead>
  <tbody>
      @php
    $statusList = [
        1 => 'In Progress',
        2 => 'Completed',
        3 => 'Failed',
        4 => 'Withdraw',
        5 => 'Generated',
        6 => 'Rejected',
    ];
    
    $productName = [
        1 => 'Mascom Pinless Airtime',
        4 => 'BPC Electricity',
    ];
    @endphp
    @foreach($transactions as $transaction)
        <tr>
            <td>{{$transaction->id }}</td>
            <td>
                {{ $productName[$transaction->product] ?? 'Not Available' }}
            </td>
            <td>{{$transaction->cell}}</td>
            <td>{{$transaction->ext_txn_no}}</td>
            <td>{{$transaction->amount}}</td>
            <td>{{$transaction->trans_id}}</td>
            <td>
                {{ $statusList[$transaction->transaction_status] ?? 'Not Available' }}
            </td>
            <td>{{$transaction->details}}</td>
        </tr>
    @endforeach
      </tbody>
</table>
        </div>
            </div>
</div>
</div>

@endsection
