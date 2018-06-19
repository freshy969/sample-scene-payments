import {
	inject,
	EntityController,
	EthereumController,
	createElement,
	Script
} from "metaverse-api";
import { EventSubscriber } from "metaverse-rpc";

const receivingAddress = "0x9dbc8ae2586267126e5067c9958720245d8cc53f";
const amount = 10;
const currency = "MANA";

export default class FlyingSpheres extends Script {
	@inject("EntityController") entityController: EntityController | null = null;
	@inject("experimentalEthereumController")
	eth: EthereumController | null = null;

	eventSubscriber: EventSubscriber | null = null;
	userPaid: boolean = false;
	isDoorClosed: boolean = true;
	tx: string | null = null;

	async systemDidEnable() {
		this.eventSubscriber = new EventSubscriber(this.entityController!);

		this.eventSubscriber.on("door_click", async () => {
			if (this.userPaid) {
				this.isDoorClosed = !this.isDoorClosed;
				await this.entityController!.setEntityAttributes("door_handle", {
					rotation: {
						x: 0,
						y: this.isDoorClosed ? 270 : 0,
						z: 0
					}
				});
				return;
			}

			// Exit if user already initiated payment
			if (this.tx) {
				return;
			}

			try {
				const tx = await this.eth!.requirePayment(
					receivingAddress,
					amount,
					currency
				);
				this.tx = tx;

				await this.entityController!.setEntityAttributes("tx-status", {
					visible: true
				});

				this.userPaid = await this.eth!.waitForMinedTx(
					currency,
					tx,
					receivingAddress
				);

				if (this.userPaid) {
					await this.entityController!.setEntityAttributes("tx-status", {
						color: "green",
						value: "Enter!",
						fontSize: 50
					});
					await this.entityController!.setEntityAttributes("door", {
						disabled: false
					});
				}
			} catch (e) {
				await this.entityController!.setEntityAttributes("tx-status", {
					visible: true,
					value: "Failed to sign MetaMask transaction",
					fontSize: 40
				});
			}
		});

		await this.render();
	}

	async render() {
		await this.entityController!.render(
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
					rotation={{ x: 0, y: 0, z: 0 }}
					transition={{ rotation: { duration: 1000, timing: "ease-in" } }}
				>
					<box
						id="door"
						scale={{ x: 1, y: 3, z: 0.05 }}
						position={{ x: -0.5, y: 1.5, z: 0 }}
						material="#door"
					/>
				</entity>
				<text
					id="tx-status"
					position={{ x: 2, y: 2, z: -0.1 }}
					color="red"
					value="Waiting for transaction..."
					visible={false}
					fontSize={40}
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
