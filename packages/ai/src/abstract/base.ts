// type BaseLayerData {
//   key: string,
//   data: any
// }

// class BaseLayer {
//   private BaseUrl: string;

//   constructor(BaseUrl: string) {
//     this.BaseUrl = BaseUrl;
//   }

//   async call(data: BaseLayerData): Promise<BaseLayerData> {
//     const result = await fetch(this.BaseUrl, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify(data),
//     });
//     return result.json();
//   }
// }

// export default BaseLayer;
