@extends('merchant.layouts.main')
@section('content')
    <div class="page">
        <div class="page-content">
           @include("merchant.shared.errors-and-messages")
            <div class="panel panel-bordered">
                <header class="panel-heading">
                    <h3 class="panel-title"><i class="wb-copy" aria-hidden="true"></i>
                        @lang("$string_file.pages_management")
                    </h3>
                </header>
                <div class="panel-body container-fluid">
                    <table id="customDataTable" class="display nowrap table table-hover table-striped w-full" style="width:100%">
                            <thead>
                            <tr>
                                <th>@lang("$string_file.sn")</th>
                                <th>@lang("$string_file.pages")</th>
                                <th>@lang("$string_file.page_name")</th>
                                <th>@lang("$string_file.action")</th>
                            </tr>
                            </thead>
                            <tbody>
                            @php $sr = $pages->firstItem() @endphp
                            @foreach($pages as $page)
                                <tr>
                                    <td>{{ $sr }}</td>
                                    <td>
                                        {{ $page->page }}
                                    </td>
                                    <td>{{!empty($page->Name($merchant->id)) ? $page->Name($merchant->id) : $page->page  }}</td>
                                    <td>
                                        @if(Auth::user('merchant')->can('edit_cms'))
                                            <a href="{{ route('merchant.page.edit',$page->id) }}"
                                               data-original-title="@lang("$string_file.edit")" data-toggle="tooltip"
                                               data-placement="top"
                                               class="btn btn-sm btn-warning menu-icon btn_edit action_btn"> <i
                                                        class="fa fa-edit"></i> </a>
                                        @endif
                                    </td>
                                </tr>
                                @php $sr++  @endphp
                            @endforeach
                            </tbody>
                        </table>
                        @include('merchant.shared.table-footer', ['table_data' => $pages, 'data' => []])
                    </div>
                </div>
            </div>
        </div>
    </div>
    @include('merchant.shared.info-setting',['info_setting'=>$info_setting,'page_name'=>'view_text'])
@endsection
