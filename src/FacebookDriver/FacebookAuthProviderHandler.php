<?php


namespace App\AccountDrivers\Drivers;


use Carbon\Carbon;
use DynamicScreen\Facebook\FacebookDriver\FacebookPersistentDataHandler;
use DynamicScreen\SdkPhp\Handlers\OAuthProviderHandler;
use Facebook\Facebook;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;

class FacebookAccountDriver extends OAuthProviderHandler
{
    public static string $provider = 'facebook';

    public function identifier()
    {
        return 'facebook-driver';
    }

    public function name()
    {
        return 'Facebook';
    }

    public function description()
    {
        return 'OAuth Facebook';
    }

    public function icon()
    {
        return "fab fa-facebook";
    }

    public function color()
    {
        return '#1977F2';
    }

    public function signin($config, $data = null)
    {
        $uuid = Str::uuid()->toString();
        $fb = $this->getFacebookClient([], $uuid);

        $helper = $fb->getRedirectLoginHelper();
//        $helper->getPersistentDataHandler()->set('space_name', Arr::get($data, 'space_name'));
//        $helper->getPersistentDataHandler()->set('account_id', Arr::get($data, 'account_id'));
        $helper->getPersistentDataHandler()->set('state', request()->get('state', $uuid));

        $permissions = ['email', 'instagram_basic', 'manage_pages']; // Optional permissions
        $redirectUrl = route('api.oauth.callback');
//        route('oauth.callback', ['driver_id' =>$this->identifier()]);
        $loginUrl = $helper->getLoginUrl($redirectUrl, $permissions);

        return $loginUrl;

    }

//    public function renderOptions($infos): View
//    {
//        try {
//            $infos = $this->getUserInfos($config);
//            return view('accounts-options.facebook', compact('config', 'infos'));
//        } catch (\Exception $e) {
//            return view('accounts-options.facebook', compact('config'));
//        }
//
//    }

    public function testConnection($config)
    {
        $fb = $this->getFB($config);

        $fb->get(
            '/me'
        );

        return response('', $fb->getLastResponse()->getHttpStatusCode());
    }

    public function getUserInfos($config)
    {
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

//        return route('manager.settings.accounts.edit', ['_spacename' => $space_name, 'account' => $account]);
    }

    public function getFacebookClient($options = [], $id = null)
    {
        return new Facebook(array_merge([
            'app_id'                => config("services.{$this->getDriverIdentifier()}.client_id"),
            'app_secret'            => config("services.{$this->getDriverIdentifier()}.client_secret"),
            'default_graph_version' => 'v6.0',
            'persistent_data_handler' => new FacebookPersistentDataHandler($id ?? Str::uuid()->toString()),
        ], $options));
    }

    public function getFB($config)
    {
        return $this->getFacebookClient([
            'default_access_token'  => Arr::get($config, 'token')
        ]);
    }

    public function getInstagramAccounts($config)
    {
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

    public function getFreshPosts($config, $pageId, $quantity = null)
    {
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

    public function getPosts($config, $pageId, $quantity = null)
    {
        return json_decode(Cache::remember("dynamicscreen.facebook::getPosts:{$pageId}, {Arr::get($config, 'account_id')}, {$quantity}", Carbon::now()->addHour(), function () use ($config, $pageId, $quantity) {
            return json_encode($this->getFreshPosts($config, $pageId, $quantity), true);
        }), true);
    }


    public function getFreshPage($config, $pageId)
    {
        $fields = 'username,rating_count,new_like_count,cover,picture.width(200).height(200),fan_count,bio,website,name,link,about,description';
        $fb = $this->getFB($config);

        $response = $fb->get('/'. $pageId .'?fields='. $fields);
        $page = collect(json_decode($response->getBody(), true));

        return $page->toArray();
    }

    public function getPage($config, $pageId)
    {
        return json_decode(Cache::remember("{$this->getDriverIdentifier()}::getPage:{$pageId}, {Arr::get($config, 'account_id')}", Carbon::now()->addHour(), function () use ($config, $pageId) {
            return json_encode($this->getFreshPage($config, $pageId), true);
        }), true);
    }

    public function getPages($config)
    {
        $fb = $this->getFB($config);
        $response = $fb->get('/me/accounts?fields=name');

        $pages = collect(json_decode($response->getBody())->data)->mapWithKeys(function ($page) use ($config) {
            $freshPage = $this->getFreshPage($config, $page->id);
            if(empty($freshPage['username'])){
                return [$page->id => $page->name];
            }
            return [$page->id => $page->name . ' - @' . $freshPage['username']];
        });

        return $pages->toArray();
    }


    public function getPhotos($config, $pageId)
    {
        $fb = $this->getFB($config);
        $photos = [];
        $listePhotos = $this->getListPhotos($config, $pageId);
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

    public function getListPhotos($config, $pageId)
    {
        $fb = $this->getFB($config);
        $response = $fb->get('/' . $pageId . '/media');
        if (!isset(json_decode($response->getBody())->data)) {
            return false;
        }
        $pictureList = json_decode($response->getBody())->data;

        return $pictureList;
    }

    public function getName($config, $id)
    {
        $fb = $this->getFB($config);
        return array_get(json_decode($fb->get('/' . $id . '?fields=name')->getBody(), true), 'name');
    }

    public function refreshToken($config)
    {
        $expires_array = Arr::get($config, 'expires');
        $expiration_date = Carbon::createFromTimeString($expires_array['date'], $expires_array['timezone']);

        if ($expiration_date->subDays(2)->isPast()) {

            try {

                $fb = new Facebook([
                    'app_id'                => config("services.{$this->getDriverIdentifier()}.client_id"),
                    'app_secret'            => config("services.{$this->getDriverIdentifier()}.client_secret"),
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
