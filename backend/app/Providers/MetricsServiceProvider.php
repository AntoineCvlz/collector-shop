<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Prometheus\CollectorRegistry;
use Prometheus\Storage\APC;
use Prometheus\Storage\InMemory;

/**
 * Enregistre le registre Prometheus partagé de l'application.
 *
 * Stockage :
 *   - APCu en production (persiste les compteurs entre les requêtes d'un même
 *     worker PHP-FPM, sans dépendance externe). Nécessite ext-apcu + apc.enable_cli.
 *   - InMemory en secours (CLI/tests sans APCu) : le registre reste fonctionnel,
 *     seules les valeurs ne survivent pas à la requête.
 *
 * Le registre est un singleton : le middleware et le contrôleur /metrics
 * partagent la même instance (donc les mêmes séries de métriques).
 */
class MetricsServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(CollectorRegistry::class, function (): CollectorRegistry {
            $storage = \extension_loaded('apcu') && \filter_var(\ini_get('apc.enabled'), FILTER_VALIDATE_BOOL)
                ? new APC
                : new InMemory;

            // $registerDefaultMetrics = false : on ne veut que nos propres séries.
            return new CollectorRegistry($storage, false);
        });
    }
}
