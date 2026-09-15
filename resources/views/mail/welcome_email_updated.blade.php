<!DOCTYPE html>
<html>
<head> 
    <meta content="text/html; charset=utf-8" http-equiv="Content-Type"/>
    <meta content="width=device-width" name="viewport"/> 
    <meta content="IE=edge" http-equiv="X-UA-Compatible"/>
    <title>Welcome Email</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
<body style="margin: 0; padding: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
    @php
        $heading=trans("$string_file.welcome");
        $subheading=trans("$string_file.welcome_to").' '.$merchant->BusinessName;
        $image='';
        $social_links = [];

        if(!empty($temp))
        {
            $heading = $temp->heading;
            $subheading = $temp->subheading;
            $message = $temp->message;
            $image=json_decode($temp->image);
            $image=$image->filename;
            if(!empty($temp->social_links))
            {
                $social_links = get_object_vars(json_decode($temp->social_links));
                $social_links = $social_links['links'];
            }
        }
    @endphp
    
    <div style="padding: 40px 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
            
            <!-- Header Section -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 50px 40px; text-align: center; position: relative;">
                <div style="background: rgba(255,255,255,0.15); width: 100px; height: 100px; margin: 0 auto 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10px); border: 3px solid rgba(255,255,255,0.3);">
                    <img width="80" height="80" style="border-radius: 50%; object-fit: cover;" src="{{get_image($merchant->BusinessLogo,'business_logo',$merchant->id, true,true,'email')}}" alt="Logo"/>
                </div>
                <h1 style="margin: 0 0 12px 0; color: #ffffff; font-size: 36px; font-weight: 700; letter-spacing: -0.5px;">{{$heading}}!</h1>
                <p style="margin: 0; color: rgba(255,255,255,0.95); font-size: 16px; font-weight: 400;">{{$subheading}}</p>
            </div>

            <!-- Main Content -->
            <div style="padding: 50px 40px;">
                
                <!-- Welcome Message -->
                <div style="text-align: center; margin-bottom: 40px;">
                    <p style="font-size: 18px; color: #2d3748; line-height: 1.6; margin: 0; font-weight: 500;">
                        @lang("$string_file.thanks_fo_choosing").' '. {{$merchant->BusinessName}}
                    </p>
                    @if($credit_option == 1)
                        <p style="font-size: 24px; color: #667eea; font-weight: 600; margin: 20px 0 0 0;">
                            @lang("$string_file.user_is_business")
                        </p>
                    @endif
                </div>

                <!-- User Information Card -->
                <div style="background: linear-gradient(135deg, #f6f8fb 0%, #f1f4f9 100%); border-radius: 12px; padding: 30px; margin-bottom: 30px; border: 1px solid #e2e8f0;">
                    <div style="display: flex; flex-wrap: wrap; gap: 20px;">
                        
                        <!-- Left Column - User Details -->
                        <div style="flex: 1; min-width: 250px;">
                            <div style="margin-bottom: 25px;">
                                <h3 style="margin: 0 0 8px 0; color: #667eea; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">{{$user_name}}</h3>
                                <p style="margin: 0; color: #2d3748; font-size: 18px; font-weight: 600;">{{$user->first_name}} {{$user->last_name}}</p>
                            </div>

                            <div style="margin-bottom: 25px;">
                                <h3 style="margin: 0 0 8px 0; color: #667eea; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                                    @if ($login_type=='EMAIL')
                                        @lang("$string_file.email")
                                    @else
                                        @lang("$string_file.phone")
                                    @endif
                                </h3>
                                <p style="margin: 0; color: #4a5568; font-size: 15px;">
                                    @if ($login_type=='EMAIL')
                                        {{$user->email}}
                                    @else
                                        {{$user->UserPhone}}
                                    @endif
                                </p>
                            </div>

                            <div style="margin-bottom: 25px;">
                                <h3 style="margin: 0 0 8px 0; color: #667eea; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                                    @lang("$string_file.registered")
                                    @if ($login_type=='EMAIL')
                                        @lang("$string_file.phone")
                                    @else
                                        @lang("$string_file.email")
                                    @endif
                                </h3>
                                <p style="margin: 0; color: #4a5568; font-size: 15px;">
                                    @if ($login_type=='EMAIL')
                                        {{$user->UserPhone}}
                                    @else
                                        {{$user->email}}
                                    @endif
                                </p>
                            </div>

                            <div>
                                <h3 style="margin: 0 0 8px 0; color: #667eea; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">@lang("$string_file.user_id")</h3>
                                <p style="margin: 0; color: #4a5568; font-size: 15px; font-family: 'Courier New', monospace; background: #ffffff; padding: 8px 12px; border-radius: 6px; display: inline-block;">{{$user->user_merchant_id}}</p>
                            </div>
                        </div>

                        <!-- Right Column - Image -->
                        <div style="flex: 0 0 auto; text-align: center;">
                            @if(!empty($image))
                                <img style="width: 150px; height: 150px; border-radius: 12px; object-fit: cover; box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);" src="{{get_image($image,'email',$merchant->id,true,true,'email')}}" alt="User Image"/>
                            @else
                                <div style="width: 150px; height: 150px; border-radius: 12px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);">
                                    <span style="color: #ffffff; font-size: 60px; font-weight: 700;">🎯</span>
                                </div>
                            @endif
                        </div>
                    </div>
                </div>

                <!-- Call to Action -->
                <!--<div style="text-align: center; margin: 40px 0;">-->
                <!--    <a href="#" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3); transition: transform 0.2s;">-->
                <!--        Get Started-->
                <!--    </a>-->
                <!--</div>-->

                <!-- Divider -->
                <div style="border-top: 2px solid #e2e8f0; margin: 40px 0;"></div>

                <!-- Footer -->
                <div style="text-align: center;">
                    <p style="margin: 0 0 15px 0; color: #718096; font-size: 13px; line-height: 1.6;">
                        © {{$merchant->BusinessName}}. @lang("$string_file.all_right_reserved")
                    </p>
                    <p style="margin: 0 0 25px 0;">
                        <a href="#" style="color: #667eea; text-decoration: none; font-size: 13px; margin: 0 10px;">@lang("$string_file.terms_conditions")</a>
                        <span style="color: #cbd5e0;">|</span>
                        <a href="#" style="color: #667eea; text-decoration: none; font-size: 13px; margin: 0 10px;">@lang("$string_file.privacy_policy")</a>
                    </p>

                    <!-- Social Links -->
                    @if(!empty($temp->social_links))
                        <div style="margin-top: 25px;">
                            @if(isset($social_links->twitter) && !empty($social_links->twitter))
                                <a href="{{$social_links->twitter}}" target="_blank" style="display: inline-block; width: 40px; height: 40px; background: #f7fafc; border-radius: 50%; margin: 0 6px; text-decoration: none; line-height: 40px; transition: background 0.3s;">
                                    <img src="{{url('/basic-images/twitter2x.png')}}" width="20" style="vertical-align: middle;" alt="Twitter"/>
                                </a>
                            @endif
                            @if(isset($social_links->facebook) && !empty($social_links->facebook))
                                <a href="{{$social_links->facebook}}" target="_blank" style="display: inline-block; width: 40px; height: 40px; background: #f7fafc; border-radius: 50%; margin: 0 6px; text-decoration: none; line-height: 40px; transition: background 0.3s;">
                                    <img src="{{url('/basic-images/facebook2x.png')}}" width="20" style="vertical-align: middle;" alt="Facebook"/>
                                </a>
                            @endif
                            @if(isset($social_links->instagram) && !empty($social_links->instagram))
                                <a href="{{$social_links->instagram}}" target="_blank" style="display: inline-block; width: 40px; height: 40px; background: #f7fafc; border-radius: 50%; margin: 0 6px; text-decoration: none; line-height: 40px; transition: background 0.3s;">
                                    <img src="{{url('/basic-images/instagram2x.png')}}" width="20" style="vertical-align: middle;" alt="Instagram"/>
                                </a>
                            @endif
                            @if(isset($social_links->linkedin) && !empty($social_links->linkedin))
                                <a href="{{$social_links->linkedin}}" target="_blank" style="display: inline-block; width: 40px; height: 40px; background: #f7fafc; border-radius: 50%; margin: 0 6px; text-decoration: none; line-height: 40px; transition: background 0.3s;">
                                    <img src="{{url('/basic-images/linkedin2x.png')}}" width="20" style="vertical-align: middle;" alt="LinkedIn"/>
                                </a>
                            @endif
                        </div>
                    @endif
                </div>
            </div>
        </div>
    </div>
</body>
</html>