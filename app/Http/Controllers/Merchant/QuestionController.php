<?php

namespace App\Http\Controllers\Merchant;
use App;
use App\Models\Configuration;
use App\Models\LanguageQuestion;
use App\Models\Question;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;
use App\Models\BookingConfiguration;

class QuestionController extends Controller
{
    public function index()
    {
        $merchant_id = Auth::user('merchant')->parent_id != 0 ? Auth::user('merchant')->parent_id : Auth::user('merchant')->id;
        $config = Configuration::where([['merchant_id', '=', $merchant_id]])->first();
        $questions = Question::where([['merchant_id', '=', $merchant_id]])->get();
        $bookingConfig = BookingConfiguration::where([['merchant_id', '=', $merchant_id]])->first();
        return view('merchant.question.index', compact('questions', 'config','bookingConfig'));
    }

    public function create()
    {
        $merchant_id = Auth::user('merchant')->parent_id != 0 ? Auth::user('merchant')->parent_id : Auth::user('merchant')->id;
        $bookingConfig = BookingConfiguration::where('merchant_id', $merchant_id)->first();
        return view('merchant.question.create',compact('bookingConfig'));
    }

    public function store(Request $request)
    {
        $merchant_id = get_merchant_id();
        $application = $request->application ?? 1;
        $question = Question::create([
            'question' => $request->question,
            'merchant_id' => $merchant_id,
            'application'=> (int)$application
        ]);
        $this->SaveLanguageQuestion($merchant_id, $question->id, $request->question);
        return redirect()->back()->with('questionadded', 'Question Added');
    }

    public function show($id)
    {
        //
    }

    public function edit($id)
    {
        $merchant_id = Auth::user('merchant')->parent_id != 0 ? Auth::user('merchant')->parent_id : Auth::user('merchant')->id;
        $config = Configuration::where([['merchant_id', '=', $merchant_id]])->first();
        $question = Question::where([['id', '=', $id]])->first();
        $bookingConfig = BookingConfiguration::where([['merchant_id', '=', $merchant_id]])->first();
        return view('merchant.question.edit', compact('question', 'config','bookingConfig'));
    }

    public function update(Request $request, $id)
    {
        $merchant_id = get_merchant_id();
        $question = Question::where([['id', '=', $id]])->first();
        // print_r($question); die();
        $question->question = $request->question;
        $question->application = $request->application ?? 1;
        $question->save();
        $this->SaveLanguageQuestion($merchant_id, $question->id, $request->question);
        return redirect()->back()->with('questionadded', 'Question Updated');
    }

    public function destroy($id)
    {
        //
    }
    
    public function SaveLanguageQuestion($merchant_id, $question_id, $question)
    {
        LanguageQuestion::updateOrCreate([
            'merchant_id' => $merchant_id, 'locale' => App::getLocale(), 'question_id' => $question_id
        ], [
            'question' => $question,
        ]);
    }
}
