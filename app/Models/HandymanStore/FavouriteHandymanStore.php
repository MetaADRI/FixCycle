<?php


namespace App\Models\HandymanStore;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FavouriteHandymanStore extends Model
{
    use HasFactory;


    protected $guarded =[];
    protected $fillable =[];

    public function HandymanStore()
    {
        return $this->belongsTo(HandymanStore::class);
    }

    public function User()
    {
        return $this->belongsTo(User::class);
    }
}
