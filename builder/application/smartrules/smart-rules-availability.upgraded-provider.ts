import {InjectionToken} from "@angular/core";

export const SMART_RULES_AVAILABILITY_TOKEN = new InjectionToken('SmartRulesAvailability');

export const smartRulesAvailabilityProvider = {
    provide: SMART_RULES_AVAILABILITY_TOKEN,
    useFactory: ($injector) => $injector.get('c8ySmartRulesAvailability'),
    deps: ['$injector']
};

