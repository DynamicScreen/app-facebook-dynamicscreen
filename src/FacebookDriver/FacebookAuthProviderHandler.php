<?php

namespace DynamicScreen\Facebook\FacebookDriver;

use App\Domain\Module\Model\Module;
use Carbon\Carbon;
use Facebook\Facebook;
use DynamicScreen\SdkPhp\Handlers\OAuthProviderHandler;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Illuminate\Support\Arr;

class FacebookAuthProviderHandler extends OAuthProviderHandler
{
    public static string $provider = 'facebook';

    public function __construct(Module $module, $config = null)
    {
        parent::__construct($module, $config);
    }

    public function color()
    {
        return '#1977F2';
    }

    public function provideData($settings = [])
    {
        $this->addData('me', fn () => $this->getUserInfos());
        $this->addData('pages', fn () => $this->getPages());
//        $this->addData('page', fn () => $this->getPage(Arr::get($settings, 'pageId')));
    }

    public function signin($callbackUrl = null)
    {
        $callbackUrl = $callbackUrl ?? route('api.oauth.callback');

        $uuid = Str::uuid()->toString();
        $fb = $this->getFacebookClient([], $uuid);

        $helper = $fb->getRedirectLoginHelper();
//        $helper->getPersistentDataHandler()->set('space_name', Arr::get($data, 'space_name'));
//        $helper->getPersistentDataHandler()->set('account_id', Arr::get($data, 'account_id'));
        $helper->getPersistentDataHandler()->set('state', request()->get('state', $uuid));

        $permissions = ['email', 'instagram_basic', 'manage_pages']; // Optional permissions
//        route('oauth.callback', ['driver_id' =>$this->identifier()]);
        $loginUrl = $helper->getLoginUrl($callbackUrl, $permissions);

        return $loginUrl;

    }

    public function testConnection($config = null)
    {
        $config = $config ?? $this->default_config;

        $fb = $this->getFB($config);

        $fb->get(
            '/me'
        );

        return response('', $fb->getLastResponse()->getHttpStatusCode());
    }

    public function getUserInfos($config = null)
    {
        $config = $config ?? $this->default_config;

        $fb = $this->getFB($config);

        $user = $fb->get(
            '/me'
        )->getDecodedBody();

        $params = http_build_query(['redirect' => false]);

        $profile_pic = $fb->get(
            "/{$user['id']}/picture?{$params}"
        )->getDecodedBody()['data'];

        return ['name' => $user['name'], 'url_picture' => $profile_pic['url']];
    }



    public function callback($request, $redirectUrl = null)
    {
        $id = $request->get('state');
        $fb = $this->getFacebookClient([], $id);

        $helper = $fb->getRedirectLoginHelper();

        if ($request->has('state')) {
            $helper->getPersistentDataHandler()->set('state', $request->get('state'));
        }

        $accessToken = $helper->getAccessToken();
        if (!$accessToken->isLongLived()) {
            $oAuth2Client = $fb->getOAuth2Client();
            $accessToken = $oAuth2Client->getLongLivedAccessToken($accessToken);
        }

        $options = ['active' => true, 'token' => $accessToken->getValue(), 'expires' => $accessToken->getExpiresAt()];
        $data = $this->processOptions($options);
        $dataStr = json_encode($data);

        return redirect()->away($redirectUrl ."&data=$dataStr");
    }

    public function getFacebookClient($options = [], $id = null)
    {
        return new Facebook(array_merge([
            'app_id'                => config("services.{$this->getProviderIdentifier()}.client_id"),
            'app_secret'            => config("services.{$this->getProviderIdentifier()}.client_secret"),
            'default_graph_version' => 'v6.0',
            'persistent_data_handler' => new FacebookPersistentDataHandler($id ?? Str::uuid()->toString()),
        ], $options));
    }

    public function getFB($config = null)
    {
        $config = $config ?? $this->default_config;

        return $this->getFacebookClient([
            'default_access_token'  => Arr::get($config, 'token')
        ]);
    }

    public function getInstagramAccounts($config = null)
    {
        $config = $config ?? $this->default_config;

        $fb = $this->getFB($config);
        $response = $fb->get('/me/accounts?fields=instagram_business_account');

        $pages = collect(json_decode($response->getBody())->data)->filter(function ($item) {
            return isset($item->instagram_business_account);
        })->map(function ($item) {
            return $item->instagram_business_account->id;
        })->mapWithKeys(function ($id) use ($fb) {
            return [$id => json_decode($fb->get('/' . $id . '?fields=name')->getBody())->name];
        });
        return $pages->toArray();
    }

    public function getFreshPosts($pageId, $quantity = null, $config = null)
    {
        $config = $config ?? $this->default_config;

        $fields = 'to,reactions.summary(total_count),message_tags,message,permalink_url,shares,from,icon,attachments,created_time,updated_time';
        $offset = 20;

        $fb = $this->getFB($config);

        $response = $fb->get('/'. $pageId .'/posts?fields='. $fields .'&limit='. $offset);
        $graphEdge = $response->getGraphEdge();
        $next = Arr::get($graphEdge->getMetaData(), 'paging.next', null);
        $allPosts = Arr::get(json_decode($response->getBody(), true), 'data', []);

        while ($next && (!$quantity || count($allPosts) < $quantity)) {
            $graphEdge = $fb->next($graphEdge);
            $next = Arr::get($graphEdge->getMetaData(), 'paging.next', null);
            collect($graphEdge)->each(function ($post) use (&$allPosts) {
                $post['reactions'] = $post['reactions']->getMetaData();
                $allPosts[] = json_decode($post, true);
            });
        }

        return !$quantity ? $allPosts : array_slice($allPosts, 0, $quantity);
    }

    public function getPosts($pageId, $quantity = null, $config = null)
    {
        $config = $config ?? $this->default_config;

//        dd($config, $pageId, $quantity);
        return json_decode(Cache::remember("{$this->getProviderIdentifier()}::getPosts:{$pageId}}, {$quantity}", Carbon::now()->addHour(), function () use ($config, $pageId, $quantity) {
            return json_encode($this->getFreshPosts($pageId, $quantity, $config), true);
        }), true);
    }


    public function getFreshPage($pageId, $config = null)
    {
        $config = $config ?? $this->default_config;

        $fields = 'username,rating_count,new_like_count,cover,picture.width(200).height(200),fan_count,bio,website,name,link,about,description';
        $fb = $this->getFB($config);

        $response = $fb->get('/'. $pageId .'?fields='. $fields);
        $page = collect(json_decode($response->getBody(), true));

        return $page->toArray();
    }

    public function getPage($pageId, $config = null)
    {
        $config = $config ?? $this->default_config;

        return json_decode(Cache::remember("{$this->getProviderIdentifier()}::getPage:{$pageId}}", Carbon::now()->addHour(), function () use ($config, $pageId) {
            return json_encode($this->getFreshPage($pageId, $config), true);
        }), true);
    }

    public function getPages($config = null)
    {
        $config = $config ?? $this->default_config;

        $fb = $this->getFB($config);

        $response = $fb->get('/me/accounts?fields=name');

        $pages = collect(json_decode($response->getBody())->data)->mapWithKeys(function ($page) use ($config) {
            $freshPage = $this->getFreshPage($page->id, $config);
            if(empty($freshPage['username'])){
                return [$page->id => $page->name];
            }
            return [$page->id => $page->name . ' - @' . $freshPage['username']];
        });

        return $pages->toArray();
    }


    public function getPhotos($pageId, $config = null)
    {
        $config = $config ?? $this->default_config;

        $fb = $this->getFB($config);
        $photos = [];
        $listePhotos = $this->getListPhotos($pageId, $config);
        if ($listePhotos) {
            foreach ($listePhotos as $photo) {
                $response = $fb->get('/' . $photo->id . '?fields=media_url');
                $photoUrl = json_decode($response->getBody())->media_url;
                $photos[] = $photoUrl;
            }
            return $photos;
        } else {
            return false;
        }
    }

    public function getListPhotos($pageId, $config = null)
    {
        $config = $config ?? $this->default_config;

        $fb = $this->getFB($config);
        $response = $fb->get('/' . $pageId . '/media');
        if (!isset(json_decode($response->getBody())->data)) {
            return false;
        }
        $pictureList = json_decode($response->getBody())->data;

        return $pictureList;
    }

    public function getUserName($id, $config = null)
    {
        $config = $config ?? $this->default_config;

        $fb = $this->getFB($config);
        return Arr::get(json_decode($fb->get('/' . $id . '?fields=name')->getBody(), true), 'name');
    }

    public function refreshToken($config = null)
    {
        $config = $config ?? $this->default_config;

        $expires_array = Arr::get($config, 'expires');
        $expiration_date = Carbon::createFromTimeString($expires_array['date'], $expires_array['timezone']);

        if ($expiration_date->subDays(2)->isPast()) {

            try {

                $fb = new Facebook([
                    'app_id'                => config("services.{$this->getProviderIdentifier()}.client_id"),
                    'app_secret'            => config("services.{$this->getProviderIdentifier()}.client_secret"),
                    'default_graph_version' => 'v6.0'
                ]);

                $oAuth2Client = $fb->getOAuth2Client();
                $accessToken = $oAuth2Client->getLongLivedAccessToken(Arr::get($config, 'token'));
                $options = ['token' => $accessToken->getValue(), 'expires' => $accessToken->getExpiresAt()];
                return $this->processOptions($options);

            } catch (\Exception $e) {
                // $account->log('Renouvellement du token échoué');
            }
        }
    }
}
