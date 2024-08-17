#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { Jpk2024BroadcastBackendTranslateFunctionStack } from '../lib/jpk2024-broadcast-backend-translate-function-stack';
import { Jpk2024BroadcastBackendDbStack } from '../lib/jpk2024-broadcast-backend-db-stack';
import { Jpk2024BroadcastBackendIvsViewersCountStack } from '../lib/jpk2024-broadcast-backend-ivs-viewers-count-stack';

const app = new cdk.App();
new Jpk2024BroadcastBackendDbStack(app, 'Jpk2024BroadcastBackendDbStack');
new Jpk2024BroadcastBackendTranslateFunctionStack(app, 'Jpk2024BroadcastBackendTranslateFunctionStack');
new Jpk2024BroadcastBackendIvsViewersCountStack(app, 'Jpk2024BroadcastBackendIvsViewersCountStack');