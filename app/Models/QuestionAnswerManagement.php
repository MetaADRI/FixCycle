<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class QuestionAnswerManagement extends Model
{
    protected $guarded = [];
    protected $hidden = array('Question');

    public function Question()
    {
        return $this->belongsTo(Question::class);
    }
}
