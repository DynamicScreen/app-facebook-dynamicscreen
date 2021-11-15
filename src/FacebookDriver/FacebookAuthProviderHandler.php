<?php


namespace DynamicScreen\Facebook\FacebookDriver;

use Illuminate\Support\Arr;
use DynamicScreen\SdkPhp\Handlers\OAuthProviderHandler;

class FacebookAuthProviderHandler extends OAuthProviderHandler
{
    public static $provider = 'unsplash';

    private $default_config = [];

    public function __construct($config = null)
    {
        $this->default_config = $config;
    }

    public function identifier()
    {
        return 'unsplash-official';
    }

    public function getDriverIdentifier(): string
    {
        return self::$provider;
    }

    public function name()
    {
        return "Unsplash";
    }

    public function description()
    {
        return "Photos";
    }

    public function icon()
    {
        return "fas fa-images";
    }

    public function color(){
        return '#239d00';
    }

    public function isSafeToBePublic()
    {
        return true;
    }

    public function signin($callbackUrl)
    {
        $scopes = ['public', 'read_user'];
        $config = ['callback_url' => $callbackUrl];

        $this->initConnection($config);

        return UnsplashClient::$connection->getConnectionUrl($scopes);
    }

    public function callback($request, $url = null)
    {
        $code = $request->input('code');

        $this->initConnection(['callback_url' => route('api.oauth.callback')]);
        $accessToken = UnsplashClient::$connection->generateToken($code);

        $data = $this->processOptions($accessToken->jsonSerialize());

        $dataStr = json_encode($data);

        return redirect()->away($url ."&data=$dataStr");
    }

    public function getUserInfos($config = null)
    {
        $config = $config ?? $this->default_config;

        $this->initConnection($config);
        $infos = UnsplashClient::$connection->getResourceOwner()->toArray();
        if(isset($infos['errors'])){
            throw new \Exception($infos['error'][0]);
        }
        return $infos;
    }

    public function testConnection($config = null)
    {
        $config = $config ?? $this->default_config;

        return $this->getUserInfos($config);
    }

    public function initConnection($config = null)
    {
        $provider = self::$provider;
        $config = $config ?? $this->default_config;

        if (isset($config['callback_url'])) {
            UnsplashClient::init([
                'applicationId' => config("services.$provider.client_id"),
                'secret' => config("services.$provider.client_secret"),
                'callbackUrl' => $config['callback_url'],
                'utmSource' => config("services.$provider.app_name")
            ]);
        }
        else if (isset($config['access_token'])) {
            UnsplashClient::init([
                'applicationId' => config("services.$provider.client_id"),
                'secret' => config("services.$provider.client_secret"),
                'utmSource' => config("services.$provider.app_name")
            ],[
                'access_token' => $config['access_token'],
                'expires_in' => 30000
            ]);
        }
    }

    public function getRandomPhoto($options, $config = null)
    {
        $config = $config ?? $this->default_config;

        $category = Arr::get($options, 'category');

        $this->initConnection($config);
        $randPhotos = Photo::random(['query' => $category, 'orientation' => 'landscape']);
        return ['photographer' => $randPhotos->user['name'], 'url' => $randPhotos->urls['raw']];
    }
}
