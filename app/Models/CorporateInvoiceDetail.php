<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CorporateInvoiceDetail extends Model
{
    use HasFactory;

    public function CorporateInvoice()
    {
        return $this->belongsTo(CorporateInvoice::class);
    }

    public function Booking()
    {
        return $this->belongsTo(Booking::class);
    }
}
