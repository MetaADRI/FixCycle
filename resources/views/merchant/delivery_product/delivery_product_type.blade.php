@extends('merchant.layouts.main')
@section('content')
    <div class="page">
        <div class="page-content container-fluid">
            @include("merchant.shared.errors-and-messages")
            <div class="panel panel-bordered">
                <header class="panel-heading">
                    <div class="panel-actions">
                        @if(!empty($info_setting) && $info_setting->view_text != "")
                            <button class="btn btn-icon btn-primary float-right" style="margin:10px"
                                    data-target="#examplePositionSidebar" data-toggle="modal" type="button">
                                <i class="wb-info ml-1 mr-1" title="Info" style=""></i>
                            </button>
                        @endif
                        <button type="button" title="@lang("$string_file.add_delivery_product_category")"
                                class="btn btn-icon btn-success float-right" style="margin:10px" data-toggle="modal"
                                data-target="#exampleModal">
                            <i class="wb-plus"></i>
                        </button>
                    </div>
                    <h3 class="panel-title">
                        <i class="fa fa-product-hunt" aria-hidden="true"></i>
                        @lang("$string_file.delivery_product_category")
                    </h3>
                </header>
                <div class="panel-body">
                    <table class="display nowrap table table-hover table-striped w-full" id="customDataTable"
                           style="width:100%"
                           cellspacing="0">
                        <thead>
                        <tr>
                            <th>@lang("$string_file.sn")</th>
                            <th>@lang("$string_file.category_name")</th>
                            <th>@lang("$string_file.status")</th>
                            <th>@lang("$string_file.action")</th>
                        </tr>
                        </thead>
                        <tbody>
                        @php $sr = $delivery_products->firstItem() @endphp
                        @foreach($delivery_products as $delivery_product)
                            <tr>
                                <td>{{ $sr }}</td>
                                <td>{{ $delivery_product->CategoryName }}</td>
                                <td>
                                    @if($delivery_product->status == 1)
                                        <span class="badge badge-success">Active</span>
                                    @else
                                        <span class="badge badge-danger">Deactivate</span>
                                    @endif
                                </td>
                                <td>
                                    @if($delivery_product->status == 1)
                                        <a class="btn btn-sm btn-danger"
                                           href="{{route('delivery_product.change_status',[$delivery_product->id,2,true])}}"><i
                                                    class="fa fa-eye-slash"></i></a>
                                    @else
                                        <a class="btn btn-sm btn-success"
                                           href="{{route('delivery_product.change_status',[$delivery_product->id,1,true])}}"><i
                                                    class="fa fa-eye"></i></a>
                                    @endif
                                    <button type="button"
                                            class="btn btn-sm btn-primary"
                                            data-toggle="modal"
                                            data-target="#editModel{{ $delivery_product->id }}">
                                        <i class="wb-edit"></i>
                                    </button>
                                </td>
                            </tr>
                            @php $sr++  @endphp
                        @endforeach
                        </tbody>
                    </table>
                    @include('merchant.shared.table-footer', ['table_data' => $delivery_products, 'data' => []])
                </div>
            </div>
        </div>
    </div>


    <!--Add Modal -->
    <div class="modal fade" id="exampleModal" tabindex="-1" role="dialog" aria-labelledby="exampleModalLabel"
         aria-hidden="true">
        <div class="modal-dialog" role="document">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title"
                        id="exampleModalLabel">@lang("$string_file.add_product")</h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <form action="{{route('delivery_product.type.store')}}" method="POST" id="delivery-product-category-form" name="delivery-product-category-form" enctype="multipart/form-data">
                    @csrf
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-6">
                                <div class="form-group">
                                    <span>@lang("$string_file.category_name")</span>
                                    <input type="text" name="category_name" class="form-control">
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary"
                                data-dismiss="modal">@lang("$string_file.reset")</button>
                        <button type="submit" class="btn btn-success">@lang("$string_file.save")</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
    
    <!-- Edit Modal for this record -->
<div class="modal fade" id="editModel{{ $delivery_product->id }}" tabindex="-1" role="dialog"
     aria-labelledby="exampleModalLabel{{ $delivery_product->id }}" aria-hidden="true">
    <div class="modal-dialog" role="document">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">@lang("$string_file.edit_delivery_product_category")</h5>
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <form action="{{ route('delivery_product.type.update', $delivery_product->id) }}" method="POST"
                  enctype="multipart/form-data">
                @csrf
                @method('PUT') {{-- Only if your route uses PUT --}}
                <div class="modal-body">
                    <div class="row">
                        <div class="col-md-6">
                            <div class="form-group">
                                <span>@lang("$string_file.category_name")</span>
                                <input type="text" name="category_name"
                                       class="form-control"
                                       value="{{ $delivery_product->CategoryName }}">
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary"
                            data-dismiss="modal">@lang("$string_file.reset")</button>
                    <button type="submit" class="btn btn-success">@lang("$string_file.save")</button>
                </div>
            </form>
        </div>
    </div>
</div>
    @include('merchant.shared.info-setting',['info_setting'=>$info_setting,'page_name'=>'view_text'])
@endsection

