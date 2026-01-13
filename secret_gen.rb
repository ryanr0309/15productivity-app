require "jwt"

key_file = "C:\\Users\\ryant\\Downloads\\AuthKey_454U8Q3B33.p8"
team_id = "YW69L3H994"
client_id = "com.ryan.fifteen.service"
key_id = "454U8Q3B33"
validity_period = 180 # In days. Max 180 (6 months) according to Apple docs.

private_key = OpenSSL::PKey::EC.new IO.read key_file

token = JWT.encode(
	{
		iss: team_id,
		iat: Time.now.to_i,
		exp: Time.now.to_i + 86400 * validity_period,
		aud: "https://appleid.apple.com",
		sub: client_id
	},
	private_key,
	"ES256",
	header_fields=
	{
		kid: key_id 
	}
)
puts token