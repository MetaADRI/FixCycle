<?php

namespace App\Models;

use App\Http\Controllers\Corporate\DepartmentController;
use Illuminate\Database\Eloquent\Model;

class EmployeeDesignation extends Model
{
    protected $guarded = [];
    public function users()
    {
        return $this->hasMany(User::class, 'designation_id');
    }

    public function Department()
    {
        return $this->belongsTo(Department::class);
    }
}
