export function getFakeData() {
  return [
    {
      id: '10215',
      name: 'Pump #1',
      type: 'pump',
      creationTime: '2017-04-21T21:00:02.288+02:00',
      lastUpdated: '2017-09-15T15:38:33.192+02:00',
      c8y_ExternalAssetId: 'Pump1234',
      c8y_AssetOwner: {
        name: 'Peter Parker',
        email: 'peter.parker@softwareag.com'
      }
    },
    {
      id: '128138',
      name: 'Pump #2',
      type: 'pump',
      creationTime: '2017-04-21T21:30:02.288+02:00',
      lastUpdated: '2019-07-07T16:12:31.919Z',
      c8y_ActiveAlarmsStatus: { minor: 1 },
      c8y_ExternalAssetId: 'Pump901u84',
      c8y_AssetOwner: {
        name: 'Bruce Wayne',
        email: 'bruce.wayne@softwareag.com'
      }
    },
    {
      id: '145075',
      name: 'Vent #1',
      type: 'vent',
      creationTime: '2017-04-23T18:24:27.330+02:00',
      lastUpdated: '2019-08-01T13:34:57.757Z',
      c8y_ActiveAlarmsStatus: { minor: 1, critical: 0, major: 1 },
      c8y_ExternalAssetId: 'Vent812',
      c8y_AssetOwner: {
        name: 'Bruce Wayne',
        email: 'bruce.wayne@softwareag.com'
      }
    },
    {
      id: '145891',
      name: 'Vent #2',
      type: 'vent',
      creationTime: '2017-04-26T22:06:42.899+02:00',
      lastUpdated: '2017-10-14T12:48:18.650+02:00',
      c8y_ActiveAlarmsStatus: { critical: 0, minor: 1 },
      c8y_ExternalAssetId: 'Vent9012',
      c8y_AssetOwner: {
        name: 'Bruce Banner',
        email: 'bruce.banner@softwareag.com'
      }
    },
    {
      id: '147224',
      name: 'Silo #1',
      type: 'silo',
      creationTime: '2017-05-12T11:47:53.913Z',
      lastUpdated: '2018-04-17T16:12:16.574Z',
      c8y_ExternalAssetId: 'Silo901238',
      c8y_AssetOwner: {
        name: 'Bruce Banner',
        email: 'bruce.banner@softwareag.com'
      }
    },
    {
      id: '147225',
      name: 'Silo #2',
      type: 'silo',
      creationTime: '2017-05-12T11:48:00.807Z',
      lastUpdated: '2017-05-12T11:48:00.807Z',
      c8y_ExternalAssetId: 'Silo12893',
      c8y_AssetOwner: {
        name: 'Peter Parker',
        email: 'peter.parker@softwareag.com'
      }
    }
  ];
}
