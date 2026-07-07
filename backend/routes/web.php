<?php

use App\Http\Controllers\MetricsController;
use Illuminate\Support\Facades\Route;

// Métriques Prometheus (format texte). Scrapé EN INTERNE par Prometheus sur le
// réseau Docker « monitoring » : nginx-edge ne proxifie pas /metrics vers
// l'extérieur (cf. docker/nginx/edge.prod.conf), donc pas d'exposition publique.
Route::get('/metrics', MetricsController::class);
