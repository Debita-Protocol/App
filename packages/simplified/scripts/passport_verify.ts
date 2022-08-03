import { PassportReader} from "@gitcoinco/passport-sdk-reader"
const args = process.argv.slice(2);



const init = async () => {
	const addr = args[0]
	const reader = new PassportReader('https://ceramic.staging.dpopp.gitcoin.co/', '1');
	console.log(await reader.getGenesis(addr))
}

init()