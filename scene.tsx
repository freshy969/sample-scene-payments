import { createElement, ScriptableScene, EthereumController, inject } from "metaverse-api";

const receivingAddress = "0x9dbc8ae2586267126e5067c9958720245d8cc53f"
const amount = 10
const currency = "MANA"
const TX_STATUS_ID = "tx-status"
const DOOR_ID = "door"

export interface  IPaymentState {
	userPaid:boolean; 
	isDoorClosed:boolean; 
	tx:string|null; 
	error:boolean
}

export default class FlyingSpheres extends ScriptableScene<{},IPaymentState> {	

	@inject("experimentalEthereumController")
	eth: EthereumController | null = null;

	state:IPaymentState = {
		error: false,
		userPaid: false,
		isDoorClosed: true,
		tx: null
	};

	async sceneDidMount() {		
		this.eventSubscriber.on(`${DOOR_ID}_click`, async () => {
			if (this.state.userPaid) {
				const newState = {
					isDoorClosed: !this.state.isDoorClosed
				}
				this,this.setState(newState)
			} else {
				if (this.state.tx) { // Exit if user already initiated payment
					return;
				}
				this.handlePayment()
			}
		});
	}

	async handlePayment() {
		try {
			this.setState({error: false});
			const tx = await this.eth!.requirePayment(
				receivingAddress,
				amount,
				currency
			);

			this.setState({tx: tx})
			
			const userPaid = await this.eth!.waitForMinedTx(
				currency,
				tx,
				receivingAddress
			);			
			if (userPaid) {
				this.setState({userPaid: true, tx: null});				
			}
		} catch (e) {
			console.log(`error trying to pay to ${receivingAddress} ${amount}${currency}`,e);
			this.setState({error: true, tx: null});
		}
	}

	async render() {
		const { userPaid, error, tx, isDoorClosed } = this.state
		
		const doorRotation = { x: 0, y: isDoorClosed ? 180 : 90 , z: 0 }

		const statusVisible = userPaid || tx !== null
		const statusFontSize = userPaid? 50 : 40
		const statusColor = userPaid? "green" : "red"
		const statusMessage = userPaid? "Enter!" : error ? "Failed to sign MetaMask transaction" : "Waiting for transaction..."

		return (
			<scene position={{ x: 5, y: 0, z: 5 }}>
				<material
					id="wall"
					albedoColor="#DDE805"
					metallic={0.6}
					roughness={0.4}
				/>
				<material
					id="roof"
					albedoColor="#F04924"
					metallic={0.6}
					roughness={0.4}
				/>
				<material
					id="door"
					albedoColor="#EB7500"
					metallic={0.6}
					roughness={0.4}
				/>

				<entity
					id="door_handle"
					rotation={doorRotation}
					transition={{ rotation: { duration: 1000, timing: "ease-in" } }}
				>
					<box
						id={DOOR_ID}
						scale={{ x: 1, y: 3, z: 0.05 }}
						position={{ x: -0.5, y: 1.5, z: 0 }}
						material="#door"
					/>
				</entity>
				<text
					id={TX_STATUS_ID}
					position={{ x: 2, y: 2, z: -0.1 }}
					color={statusColor}
					value={statusMessage}
					visible={statusVisible}
					fontSize={statusFontSize}
					hAlign="center"
				/>

				<text
					position={{ x: -1, y: 2, z: -0.1 }}
					color="white"
					value="The Most Interesting Thing"
					fontSize={40}
					hAlign="center"
				/>
				<text
					position={{ x: -1, y: 1.8, z: -0.1 }}
					color="white"
					value={`Price to enter: ${amount} ${currency}`}
					fontSize={40}
					hAlign="center"
				/>

				<box
					position={{ x: 2, y: 1.5, z: 0 }}
					scale={{ x: 2, y: 3, z: 0.05 }}
					material="#wall"
				/>
				<box
					position={{ x: -1, y: 1.5, z: 0 }}
					scale={{ x: 2, y: 3, z: 0.05 }}
					material="#wall"
				/>

				<box
					rotation={{ x: 0, y: 90, z: 0 }}
					position={{ x: 3, y: 1.5, z: 1.5 }}
					scale={{ x: 3, y: 3, z: 0.05 }}
					material="#wall"
				/>
				<box
					rotation={{ x: 0, y: 90, z: 0 }}
					position={{ x: -2, y: 1.5, z: 1.5 }}
					scale={{ x: 3, y: 3, z: 0.05 }}
					material="#wall"
				/>

				<box
					position={{ x: 1.5, y: 1.5, z: 3 }}
					scale={{ x: 3, y: 3, z: 0.05 }}
					material="#wall"
				/>
				<box
					position={{ x: -0.5, y: 1.5, z: 3 }}
					scale={{ x: 3, y: 3, z: 0.05 }}
					material="#wall"
				/>

				<box
					rotation={{ x: 90, y: 0, z: 0 }}
					position={{ x: 0.5, y: 3, z: 1.3 }}
					scale={{ x: 6, y: 4, z: 0.05 }}
					material="#roof"
				/>
			</scene>
		);
	}
}
