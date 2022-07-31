import sdkverifier from "@gitcoinco/passport-sdk-verifier"
import sdkreader from "@gitcoinco/passport-sdk-reader"
const args = process.argv.slice(2);
const reader = new sdkreader.PassportReader('https://ceramic.staging.dpopp.gitcoin.co/', '1');

const verifier = new sdkverifier.PassportVerifier();

async function verify(add) {	
	const passport = await reader.getPassport(add);
	const verified = await verifier.verifyPassport(add, passport);
	return(verified)
}
verify(args[0]).then(pass => {console.log(pass);}).catch(err => {console.log(err);});