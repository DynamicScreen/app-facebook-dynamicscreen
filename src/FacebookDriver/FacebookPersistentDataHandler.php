<?php

namespace DynamicScreen\Facebook\FacebookDriver;

use Facebook\PersistentData\PersistentDataInterface;
use Illuminate\Support\Facades\Cache;

class FacebookPersistentDataHandler implements PersistentDataInterface
{

    protected $id;

    public function __construct($id)
    {
        $this->id = 'oauth_facebook_' . $id;
    }

    /**
     * Get a value from a persistent data store.
     *
     * @param string $key
     *
     * @return mixed
     */
    public function get($key)
    {
        return Cache::get($this->id . '__' . $key);
    }

    /**
     * Set a value in the persistent data store.
     *
     * @param string $key`
     * @param mixed $value
     */
    public function set($key, $value)
    {
        Cache::put($this->id . '__' . $key, $value, now()->addHour());
    }
}