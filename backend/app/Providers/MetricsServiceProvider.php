<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Prometheus\CollectorRegistry;
use Prometheus\Storage\Adapter;
use Prometheus\Storage\APC;
use Prometheus\Storage\InMemory;

class MetricsServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(CollectorRegistry::class, function (): CollectorRegistry {
            return new CollectorRegistry($this->makeStorage(), false);
        });
    }

    private function makeStorage(): Adapter
    {
        if (\extension_loaded('apcu') && \function_exists('apcu_enabled') && \apcu_enabled()) {
            return new APC;
        }

        return new InMemory;
    }
}
